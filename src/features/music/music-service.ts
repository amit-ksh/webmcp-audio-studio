import { saveAsset } from '../../storage/indexed-db'
import { getAudioContext } from '../../audio/audio-context'
import { cacheAudioBuffer } from '../../audio/audio-buffer-pool'
import { audioBufferToWav } from '../../audio/exporters/wav-exporter'
import { useProjectStore } from '../../stores/project-store'
import { generateId } from '../../lib/utils'
import type { AudioAsset } from '../../contracts/project'
import type { MusicRequest } from '../../contracts/audio'

export interface MusicProgressCallback {
  (info: { progress: number; message: string }): void
}

class MusicService {
  public async generateMusic(
    request: MusicRequest,
    onProgress?: MusicProgressCallback,
  ): Promise<AudioAsset> {
    onProgress?.({ progress: 10, message: 'Synthesizing musical arrangement...' })

    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL('../../workers/music.worker.ts', import.meta.url),
        { type: 'module' },
      )

      worker.onmessage = async (event) => {
        const data = event.data

        if (data.type === 'PROGRESS') {
          onProgress?.({
            progress: data.progress,
            message: data.message,
          })
        } else if (data.type === 'RESULT') {
          try {
            const { channelL, channelR, sampleRate } = data
            const ctx = getAudioContext()

            // Build Stereo Web Audio AudioBuffer
            const audioBuffer = ctx.createBuffer(2, channelL.length, sampleRate)
            audioBuffer.copyToChannel(channelL, 0)
            audioBuffer.copyToChannel(channelR, 1)

            // Convert to 16-bit stereo WAV blob
            const wavBlob = audioBufferToWav(audioBuffer, sampleRate)

            const assetId = generateId('asset_music')
            const moodNames: Record<string, string> = {
              energetic_tech: 'Energetic Tech',
              cinematic_reveal: 'Cinematic Reveal',
              ambient_minimal: 'Ambient Minimal',
              upbeat_fun: 'Upbeat & Fun',
            }
            const assetName = `Music - ${moodNames[request.mood] || request.mood} (${request.durationSec}s)`

            const assetMeta: AudioAsset = {
              id: assetId,
              name: assetName,
              type: 'music',
              mimeType: 'audio/wav',
              durationSec: audioBuffer.duration,
              sampleRate: audioBuffer.sampleRate,
              channels: 2,
              sizeBytes: wavBlob.size,
              createdAt: Date.now(),
              metadata: {
                prompt: request.prompt,
                mood: request.mood,
                bpm: request.bpm,
                durationSec: request.durationSec,
              },
            }

            // Cache in memory and persist in IndexedDB
            cacheAudioBuffer(assetId, audioBuffer)
            await saveAsset(assetMeta, wavBlob)

            const store = useProjectStore.getState()
            store.addAsset(assetMeta)

            // Auto-insert clip to music track if requested
            if (request.autoInsertToTimeline) {
              let musicTrack = store.currentProject?.tracks.find(
                (t) => t.id === request.targetTrackId || t.type === 'music',
              )
              if (!musicTrack && store.currentProject && store.currentProject.tracks.length > 0) {
                musicTrack = store.currentProject.tracks[0]
              }

              if (musicTrack) {
                let startSec = request.startSec ?? 0
                if (request.startSec === undefined && musicTrack.clips.length > 0) {
                  const lastClip = musicTrack.clips[musicTrack.clips.length - 1]
                  startSec = lastClip.startSec + lastClip.durationSec + 0.5
                }

                store.addClipToTrack(musicTrack.id, {
                  assetId,
                  name: `Music: ${moodNames[request.mood] || request.mood}`,
                  startSec,
                  durationSec: audioBuffer.duration,
                  offsetSec: 0,
                  gain: 0.8,
                  fadeInSec: 0.5,
                  fadeOutSec: 1.0,
                })
              }
            }

            onProgress?.({ progress: 100, message: 'Backing track ready!' })
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
        reject(new Error(`Music Worker error: ${err.message || 'Unknown'}`))
      }

      worker.postMessage({
        type: 'GENERATE',
        payload: {
          prompt: request.prompt,
          mood: request.mood,
          durationSec: request.durationSec,
          bpm: request.bpm,
        },
      })
    })
  }
}

export const musicService = new MusicService()
