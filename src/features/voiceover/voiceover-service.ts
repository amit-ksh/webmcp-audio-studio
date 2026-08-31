import { saveAsset } from '../../storage/indexed-db'
import { getAudioContext } from '../../audio/audio-context'
import { cacheAudioBuffer } from '../../audio/audio-buffer-pool'
import { audioBufferToWav } from '../../audio/exporters/wav-exporter'
import { useProjectStore } from '../../stores/project-store'
import { generateId } from '../../lib/utils'
import type { AudioAsset } from '../../contracts/project'
import type { VoiceoverRequest } from '../../contracts/audio'

export interface VoiceoverProgressCallback {
  (info: { progress: number; message: string }): void
}

class VoiceoverService {
  public async generateVoiceover(
    request: VoiceoverRequest,
    onProgress?: VoiceoverProgressCallback,
  ): Promise<AudioAsset> {
    onProgress?.({ progress: 10, message: 'Starting speech synthesis worker...' })

    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../../workers/tts.worker.ts', import.meta.url), {
        type: 'module',
      })

      worker.onmessage = async (event) => {
        const data = event.data

        if (data.type === 'PROGRESS') {
          onProgress?.({
            progress: data.progress,
            message: data.message,
          })
        } else if (data.type === 'RESULT') {
          try {
            const { audioData, sampleRate } = data
            const ctx = getAudioContext()

            // Build Web Audio AudioBuffer from synthesized Float32Array
            const audioBuffer = ctx.createBuffer(1, audioData.length, sampleRate)
            audioBuffer.copyToChannel(audioData, 0)

            // Convert to standard WAV blob
            const wavBlob = audioBufferToWav(audioBuffer, sampleRate)

            const assetId = generateId('asset_voice')
            const assetName = `Voiceover - ${request.voiceId} (${request.text.slice(0, 20)}...)`

            const assetMeta: AudioAsset = {
              id: assetId,
              name: assetName,
              type: 'voiceover',
              mimeType: 'audio/wav',
              durationSec: audioBuffer.duration,
              sampleRate: audioBuffer.sampleRate,
              channels: 1,
              sizeBytes: wavBlob.size,
              createdAt: Date.now(),
              metadata: {
                scriptText: request.text,
                voiceId: request.voiceId,
                speed: request.speed,
                pitch: request.pitch,
              },
            }

            // Cache buffer in memory and persist in IndexedDB
            cacheAudioBuffer(assetId, audioBuffer)
            await saveAsset(assetMeta, wavBlob)

            const store = useProjectStore.getState()
            store.addAsset(assetMeta)

            // Auto-insert clip to voiceover track if requested
            if (request.autoInsertToTimeline) {
              let voiceTrack = store.currentProject?.tracks.find(
                (t) => t.id === request.targetTrackId || t.type === 'voiceover',
              )
              if (!voiceTrack && store.currentProject && store.currentProject.tracks.length > 0) {
                voiceTrack = store.currentProject.tracks[0]
              }

              if (voiceTrack) {
                let startSec = request.startSec ?? 0
                if (request.startSec === undefined && voiceTrack.clips.length > 0) {
                  const latestClipEnd = voiceTrack.clips.reduce(
                    (latestEnd, clip) => Math.max(latestEnd, clip.startSec + clip.durationSec),
                    0,
                  )
                  startSec = latestClipEnd + 0.5
                }

                store.addClipToTrack(voiceTrack.id, {
                  assetId,
                  name: `Narration: ${request.text.slice(0, 16)}...`,
                  startSec,
                  durationSec: audioBuffer.duration,
                  offsetSec: 0,
                  gain: 1.0,
                  fadeInSec: 0.05,
                  fadeOutSec: 0.05,
                })
              }
            }

            onProgress?.({ progress: 100, message: 'Voiceover generated and added to library!' })
            worker.terminate()
            resolve(assetMeta)
          } catch (err) {
            worker.terminate()
            reject(err)
          }
        } else if (data.type === 'ERROR') {
          worker.terminate()
          reject(new Error(data.error))
        }
      }

      worker.onerror = (err) => {
        worker.terminate()
        reject(new Error(`TTS Worker error: ${err.message || 'Unknown'}`))
      }

      worker.postMessage({
        type: 'GENERATE',
        payload: {
          text: request.text,
          voiceId: request.voiceId,
          speed: request.speed,
          pitch: request.pitch,
        },
      })
    })
  }
}

export const voiceoverService = new VoiceoverService()
