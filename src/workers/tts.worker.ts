import { KokoroTTS } from 'kokoro-js'

interface TTSPayload {
  text: string
  voiceId: string
  speed: number
}

interface ModelProgressInfo {
  status?: string
  file?: string
  progress?: number
}

type KokoroVoice =
  | 'am_michael'
  | 'af_heart'
  | 'am_puck'
  | 'bm_george'

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'

const VOICE_MAP: Record<string, KokoroVoice> = {
  narrator_male: 'am_michael',
  narrator_female: 'af_heart',
  energetic_launch: 'am_puck',
  executive_calm: 'bm_george',
}

let synthesizerPromise: Promise<KokoroTTS> | null = null
let lastModelProgress = 0

function reportProgress(progress: number, message: string) {
  self.postMessage({ type: 'PROGRESS', progress, message })
}

function getSynthesizer(): Promise<KokoroTTS> {
  if (!synthesizerPromise) {
    synthesizerPromise = KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: 'q8',
      device: null,
      progress_callback: (info: ModelProgressInfo) => {
        if (info.status !== 'progress') return

        const modelProgress = Math.max(0, Math.min(100, info.progress ?? 0))
        const fileName = info.file?.split('/').pop()
        const isModelWeight = fileName?.endsWith('.onnx') ?? false
        const nextProgress = isModelWeight
          ? 12 + Math.round(modelProgress * 0.56)
          : 10

        if (nextProgress <= lastModelProgress) return
        lastModelProgress = nextProgress

        reportProgress(nextProgress, isModelWeight
          ? `Downloading voice model (${Math.round(modelProgress)}%)`
          : 'Preparing voice model files...')
      },
    }).catch((error) => {
      synthesizerPromise = null
      lastModelProgress = 0
      throw error
    })
  }

  return synthesizerPromise
}

self.onmessage = async (event: MessageEvent<{ type: string; payload: TTSPayload }>) => {
  const { type, payload } = event.data
  if (type !== 'GENERATE') return

  try {
    reportProgress(5, 'Loading local neural voice model...')
    const synthesizer = await getSynthesizer()

    reportProgress(76, 'Converting text into natural speech...')
    const voice = VOICE_MAP[payload.voiceId] ?? VOICE_MAP.narrator_male
    const output = await synthesizer.generate(payload.text.trim(), {
      voice,
      speed: Math.max(0.75, Math.min(1.5, payload.speed || 1)),
    })

    const audioData = new Float32Array(output.audio)
    reportProgress(94, 'Preparing voiceover audio...')

    self.postMessage(
      {
        type: 'RESULT',
        audioData,
        sampleRate: output.sampling_rate,
        durationSec: audioData.length / output.sampling_rate,
      },
      { transfer: [audioData.buffer] },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    self.postMessage({
      type: 'ERROR',
      error: `Voice generation failed: ${message}`,
    })
  }
}
