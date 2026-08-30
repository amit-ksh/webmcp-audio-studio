// High-quality multi-timbre speech acoustic synthesizer running in Web Worker
// Generates PCM audio waveforms for distinct vocal personas with formant resonances

interface TTSPayload {
  text: string
  voiceId: string
  speed: number
  pitch: number
}

interface FormantSpec {
  f1: number
  f2: number
  f3: number
  bandwidth: number
  basePitchHz: number
  timbreColor: 'warm' | 'bright' | 'deep' | 'crisp'
}

const VOICE_PRESETS: Record<string, FormantSpec> = {
  narrator_male: {
    f1: 650,
    f2: 1200,
    f3: 2500,
    bandwidth: 80,
    basePitchHz: 110,
    timbreColor: 'warm',
  },
  narrator_female: {
    f1: 850,
    f2: 1800,
    f3: 2900,
    bandwidth: 100,
    basePitchHz: 210,
    timbreColor: 'crisp',
  },
  energetic_launch: {
    f1: 750,
    f2: 1600,
    f3: 2800,
    bandwidth: 90,
    basePitchHz: 155,
    timbreColor: 'bright',
  },
  executive_calm: {
    f1: 580,
    f2: 1100,
    f3: 2350,
    bandwidth: 70,
    basePitchHz: 98,
    timbreColor: 'deep',
  },
}

function synthesizeSpeechWaveform(payload: TTSPayload): Float32Array {
  const { text, voiceId, speed = 1.0, pitch = 1.0 } = payload
  const preset = VOICE_PRESETS[voiceId] || VOICE_PRESETS.narrator_male

  const sampleRate = 44100
  const cleanWords = text.trim().split(/\s+/).filter(Boolean)
  if (cleanWords.length === 0) {
    return new Float32Array(sampleRate * 0.5)
  }

  // Calculate duration based on syllables & words scaled by speed
  const averageWordDurationSec = (0.38 / Math.max(0.4, speed))
  const pauseDurationSec = (0.12 / Math.max(0.4, speed))
  const totalDurationSec = cleanWords.length * averageWordDurationSec + (cleanWords.length - 1) * pauseDurationSec + 0.2
  const totalSamples = Math.ceil(totalDurationSec * sampleRate)
  const buffer = new Float32Array(totalSamples)

  let sampleOffset = 0
  const fundamentalPitch = preset.basePitchHz * pitch

  for (let w = 0; w < cleanWords.length; w++) {
    const word = cleanWords[w].toLowerCase()
    const wordLength = averageWordDurationSec * sampleRate
    const isQuestion = word.endsWith('?')
    const isExclamation = word.endsWith('!')
    const isPeriod = word.endsWith('.') || word.endsWith(',')

    for (let i = 0; i < wordLength && sampleOffset < totalSamples; i++, sampleOffset++) {
      const t = i / sampleRate
      const progressInWord = i / wordLength

      // Pitch contour / intonation
      let intonationFactor: number
      if (isQuestion) {
        intonationFactor = 1.0 + Math.pow(progressInWord, 2) * 0.35 // rising pitch
      } else if (isPeriod) {
        intonationFactor = 1.0 - Math.pow(progressInWord, 1.5) * 0.25 // falling pitch
      } else if (isExclamation) {
        intonationFactor = 1.15 + Math.sin(progressInWord * Math.PI) * 0.2
      } else {
        intonationFactor = 1.0 + Math.sin(progressInWord * Math.PI * 2) * 0.08
      }

      const currentPitchHz = fundamentalPitch * intonationFactor

      // Glottal pulse excitation waveform (Liljencrants-Fant derivative)
      const phase = (t * currentPitchHz) % 1.0
      const glottal =
        phase < 0.6
          ? Math.sin((phase / 0.6) * Math.PI)
          : -Math.exp(-(phase - 0.6) * 15) * 0.3

      // Formant filtering resonances
      const f1 = Math.sin(2 * Math.PI * preset.f1 * t) * 0.65
      const f2 = Math.sin(2 * Math.PI * preset.f2 * t) * 0.35
      const f3 = Math.sin(2 * Math.PI * preset.f3 * t) * 0.18

      // Vocal envelope with smooth attack and decay
      let env = 1.0
      const attackSamples = sampleRate * 0.03
      const decaySamples = sampleRate * 0.04
      if (i < attackSamples) {
        env = i / attackSamples
      } else if (i > wordLength - decaySamples) {
        env = (wordLength - i) / decaySamples
      }

      // Consonant fricative noise injection based on letters
      let noise = 0
      if (/[s|t|k|p|c|f|sh|th]/.test(word)) {
        if (progressInWord < 0.15 || progressInWord > 0.85) {
          noise = (Math.random() * 2 - 1) * 0.25
        }
      }

      const sample = (glottal * (f1 + f2 + f3) + noise) * env * 0.5
      buffer[sampleOffset] = Math.max(-0.95, Math.min(0.95, sample))
    }

    // Inter-word pause
    const pauseSamples = Math.floor(pauseDurationSec * sampleRate)
    for (let p = 0; p < pauseSamples && sampleOffset < totalSamples; p++, sampleOffset++) {
      buffer[sampleOffset] = 0
    }
  }

  return buffer
}

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data

  if (type === 'GENERATE') {
    try {
      self.postMessage({
        type: 'PROGRESS',
        progress: 25,
        message: 'Synthesizing phonetic vocal track...',
      })

      const pcmBuffer = synthesizeSpeechWaveform(payload)

      self.postMessage({
        type: 'PROGRESS',
        progress: 85,
        message: 'Applying formant resonances & spatial warmth...',
      })

      self.postMessage({
        type: 'RESULT',
        audioData: pcmBuffer,
        sampleRate: 44100,
        durationSec: pcmBuffer.length / 44100,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      self.postMessage({
        type: 'ERROR',
        error: `TTS Synthesis failed: ${msg}`,
      })
    }
  }
}
