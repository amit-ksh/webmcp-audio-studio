import { pipeline, env } from '@huggingface/transformers'

// Configure transformers.js for browser worker environment
env.allowLocalModels = false
env.useBrowserCache = true

interface PipelineProgressInfo {
  status: string
  file?: string
  progress?: number
}

interface WhisperOutputChunk {
  timestamp: [number, number]
  text: string
}

interface WhisperOutput {
  text: string
  chunks?: WhisperOutputChunk[]
}

type TranscribePipeline = (
  input: Float32Array,
  options?: Record<string, unknown>,
) => Promise<WhisperOutput>

let transcriber: TranscribePipeline | null = null
let currentDevice = 'wasm'
let isCancelled = false

async function initPipeline(devicePreference = 'auto'): Promise<TranscribePipeline> {
  if (transcriber) return transcriber

  // WebGPU capability check
  if (devicePreference === 'auto' || devicePreference === 'webgpu') {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const gpuNav = navigator as unknown as {
          gpu?: { requestAdapter: () => Promise<unknown> }
        }
        const adapter = await gpuNav.gpu?.requestAdapter()
        if (adapter) {
          currentDevice = 'webgpu'
        }
      } catch {
        currentDevice = 'wasm'
      }
    } else {
      currentDevice = 'wasm'
    }
  } else {
    currentDevice = 'wasm'
  }

  self.postMessage({
    type: 'PROGRESS',
    status: 'loading',
    progress: 10,
    message: `Loading Whisper model (${currentDevice.toUpperCase()})...`,
    device: currentDevice,
  })

  try {
    const pipe = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
      device: currentDevice as 'webgpu' | 'wasm',
      progress_callback: (info: PipelineProgressInfo) => {
        if (info.status === 'progress') {
          self.postMessage({
            type: 'PROGRESS',
            status: 'loading',
            progress: Math.min(90, Math.round(info.progress || 0)),
            message: `Downloading model weights (${info.file || ''}): ${Math.round(info.progress || 0)}%`,
            device: currentDevice,
          })
        }
      },
    })
    transcriber = pipe as unknown as TranscribePipeline
  } catch (err) {
    if (currentDevice === 'webgpu') {
      console.warn('WebGPU failed, falling back to WASM...', err)
      currentDevice = 'wasm'
      const pipe = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
        device: 'wasm',
      })
      transcriber = pipe as unknown as TranscribePipeline
    } else {
      throw err
    }
  }

  self.postMessage({
    type: 'PROGRESS',
    status: 'ready',
    progress: 100,
    message: `Whisper model ready (${currentDevice.toUpperCase()})`,
    device: currentDevice,
  })

  return transcriber
}

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data

  if (type === 'CANCEL') {
    isCancelled = true
    self.postMessage({ type: 'CANCELLED' })
    return
  }

  if (type === 'INIT') {
    try {
      await initPipeline(payload?.device || 'auto')
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err)
      self.postMessage({
        type: 'ERROR',
        error: `Failed to load Whisper model: ${errMessage}`,
      })
    }
    return
  }

  if (type === 'TRANSCRIBE') {
    isCancelled = false
    const { audioData, language = 'en' } = payload

    try {
      const model = await initPipeline()

      if (isCancelled) {
        self.postMessage({ type: 'CANCELLED' })
        return
      }

      self.postMessage({
        type: 'PROGRESS',
        status: 'transcribing',
        progress: 30,
        message: 'Transcribing speech audio with timestamps...',
        device: currentDevice,
      })

      const output = await model(audioData, {
        language,
        task: 'transcribe',
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
      })

      if (isCancelled) {
        self.postMessage({ type: 'CANCELLED' })
        return
      }

      // Format segments
      const text = typeof output.text === 'string' ? output.text.trim() : ''
      const chunks = Array.isArray(output.chunks) ? output.chunks : []
      const segments = chunks.map((c, idx) => ({
        id: `seg_${idx}_${Date.now()}`,
        start: Array.isArray(c.timestamp) ? c.timestamp[0] ?? 0 : 0,
        end: Array.isArray(c.timestamp) ? c.timestamp[1] ?? 0 : 0,
        text: (c.text || '').trim(),
      }))

      self.postMessage({
        type: 'RESULT',
        text,
        segments:
          segments.length > 0
            ? segments
            : [
                {
                  id: `seg_0_${Date.now()}`,
                  start: 0,
                  end: audioData.length / 16000,
                  text,
                },
              ],
        device: currentDevice,
      })
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err)
      self.postMessage({
        type: 'ERROR',
        error: `Transcription error: ${errMessage}`,
      })
    }
  }
}
