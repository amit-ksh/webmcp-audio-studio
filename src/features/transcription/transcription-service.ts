import { getAssetBlob, saveTranscript } from '../../storage/indexed-db'
import { getAudioContext } from '../../audio/audio-context'
import { useProjectStore } from '../../stores/project-store'
import type { Transcript, TranscriptSegment } from '../../contracts/project'

export interface TranscriptionProgressCallback {
  (info: { status: 'loading' | 'transcribing' | 'ready' | 'completed' | 'error'; progress: number; message: string; device?: string }): void
}

class TranscriptionService {
  private currentWorker: Worker | null = null

  /**
   * Resamples any audio blob/arrayBuffer into 16,000Hz mono Float32Array PCM
   */
  public async prepareAudioPCM(assetId: string): Promise<Float32Array> {
    const blob = await getAssetBlob(assetId)
    if (!blob) {
      throw new Error(`Audio asset not found: ${assetId}`)
    }

    const arrayBuffer = await blob.arrayBuffer()
    const ctx = getAudioContext()
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0))

    // Downmix / resample to 16kHz mono using OfflineAudioContext
    const targetSampleRate = 16000
    const targetLength = Math.ceil(decoded.duration * targetSampleRate)
    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate)

    const source = offlineCtx.createBufferSource()
    source.buffer = decoded
    source.connect(offlineCtx.destination)
    source.start(0)

    const rendered = await offlineCtx.startRendering()
    return rendered.getChannelData(0)
  }

  public async transcribeAsset(
    assetId: string,
    language = 'en',
    onProgress?: TranscriptionProgressCallback,
  ): Promise<Transcript> {
    this.cancel()

    onProgress?.({
      status: 'loading',
      progress: 5,
      message: 'Preparing 16kHz PCM audio...',
    })

    const pcmData = await this.prepareAudioPCM(assetId)

    return new Promise((resolve, reject) => {
      // Instantiate worker using ES module syntax supported by Vite
      const worker = new Worker(
        new URL('../../workers/whisper.worker.ts', import.meta.url),
        { type: 'module' },
      )
      this.currentWorker = worker

      worker.onmessage = async (event) => {
        const data = event.data

        if (data.type === 'PROGRESS') {
          onProgress?.({
            status: data.status,
            progress: data.progress,
            message: data.message,
            device: data.device,
          })
        } else if (data.type === 'RESULT') {
          const transcript: Transcript = {
            assetId,
            text: data.text,
            segments: data.segments as TranscriptSegment[],
            language,
            createdAt: Date.now(),
          }

          // Persist to IndexedDB
          await saveTranscript(transcript)

          // Update asset in store
          const store = useProjectStore.getState()
          const asset = store.assets.find((a) => a.id === assetId)
          if (asset) {
            store.addAsset({ ...asset, transcript })
          }

          onProgress?.({
            status: 'completed',
            progress: 100,
            message: 'Transcription completed successfully!',
            device: data.device,
          })

          worker.terminate()
          this.currentWorker = null
          resolve(transcript)
        } else if (data.type === 'ERROR') {
          onProgress?.({
            status: 'error',
            progress: 0,
            message: data.error,
          })
          worker.terminate()
          this.currentWorker = null
          reject(new Error(data.error))
        } else if (data.type === 'CANCELLED') {
          worker.terminate()
          this.currentWorker = null
          reject(new Error('Transcription cancelled by user'))
        }
      }

      worker.onerror = (err) => {
        worker.terminate()
        this.currentWorker = null
        reject(new Error(`Worker error: ${err.message || 'Unknown error'}`))
      }

      // Send transcription payload
      worker.postMessage({
        type: 'TRANSCRIBE',
        payload: {
          audioData: pcmData,
          language,
        },
      })
    })
  }

  public cancel(): void {
    if (this.currentWorker) {
      this.currentWorker.postMessage({ type: 'CANCEL' })
      this.currentWorker.terminate()
      this.currentWorker = null
    }
  }
}

export const transcriptionService = new TranscriptionService()
