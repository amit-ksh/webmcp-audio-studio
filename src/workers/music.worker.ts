// Multi-layer procedural harmonic music synthesizer Web Worker
// Generates stereo PCM backing tracks with layered drums, bass, chords, arps, and risers

interface MusicPayload {
  prompt: string
  mood: 'energetic_tech' | 'cinematic_reveal' | 'ambient_minimal' | 'upbeat_fun'
  durationSec: number
  bpm: number
}

// Frequencies for musical notes (Hz)
const NOTE_FREQ: Record<string, number> = {
  C2: 65.41,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
}

interface MoodHarmonics {
  rootNotes: string[]
  chords: string[][]
  arpNotes: string[]
  drumPattern: 'tech' | 'cinematic' | 'ambient' | 'upbeat'
  filterModSpeed: number
}

const MOOD_CONFIGS: Record<string, MoodHarmonics> = {
  energetic_tech: {
    rootNotes: ['A2', 'F2', 'C3', 'G2'],
    chords: [
      ['A3', 'C4', 'E4', 'A4'],
      ['F3', 'A3', 'C4', 'F4'],
      ['C3', 'E3', 'G3', 'C4'],
      ['G3', 'B3', 'D4', 'G4'],
    ],
    arpNotes: ['A4', 'C5', 'E5', 'G5', 'A5', 'E5', 'C5', 'G4'],
    drumPattern: 'tech',
    filterModSpeed: 0.25,
  },
  cinematic_reveal: {
    rootNotes: ['D2', 'A2', 'F2', 'C3'],
    chords: [
      ['D3', 'F3', 'A3', 'D4'],
      ['A2', 'C3', 'E3', 'A3'],
      ['F3', 'A3', 'C4', 'E4'],
      ['C3', 'E3', 'G3', 'B3'],
    ],
    arpNotes: ['D4', 'F4', 'A4', 'D5', 'A4', 'F4'],
    drumPattern: 'cinematic',
    filterModSpeed: 0.1,
  },
  ambient_minimal: {
    rootNotes: ['E2', 'C2', 'G2', 'D2'],
    chords: [
      ['E3', 'G3', 'B3', 'D4', 'E4'],
      ['C3', 'E3', 'G3', 'B3', 'D4'],
      ['G3', 'B3', 'D4', 'G4'],
      ['D3', 'F3', 'A3', 'D4'],
    ],
    arpNotes: ['E4', 'G4', 'B4', 'D5'],
    drumPattern: 'ambient',
    filterModSpeed: 0.05,
  },
  upbeat_fun: {
    rootNotes: ['C2', 'A2', 'F2', 'G2'],
    chords: [
      ['C3', 'E3', 'G3', 'C4'],
      ['A2', 'C3', 'E3', 'A3'],
      ['F2', 'A2', 'C3', 'F3'],
      ['G2', 'B2', 'D3', 'G3'],
    ],
    arpNotes: ['C4', 'E4', 'G4', 'C5', 'G4', 'E4'],
    drumPattern: 'upbeat',
    filterModSpeed: 0.5,
  },
}

function generateStereoMusicTrack(payload: MusicPayload): {
  channelL: Float32Array
  channelR: Float32Array
  sampleRate: number
} {
  const { mood = 'energetic_tech', durationSec = 30, bpm = 120 } = payload
  const config = MOOD_CONFIGS[mood] || MOOD_CONFIGS.energetic_tech

  const sampleRate = 44100
  const totalSamples = Math.ceil(durationSec * sampleRate)
  const channelL = new Float32Array(totalSamples)
  const channelR = new Float32Array(totalSamples)

  const secondsPerBeat = 60 / bpm
  const secondsPerMeasure = secondsPerBeat * 4
  const samplesPerMeasure = Math.floor(secondsPerMeasure * sampleRate)
  const totalMeasures = Math.ceil(durationSec / secondsPerMeasure)

  for (let m = 0; m < totalMeasures; m++) {
    const chordIndex = m % config.chords.length
    const currentChord = config.chords[chordIndex]
    const rootNote = config.rootNotes[chordIndex]
    const rootFreq = NOTE_FREQ[rootNote] || 110.0
    const measureStartSample = m * samplesPerMeasure

    for (
      let i = 0;
      i < samplesPerMeasure && measureStartSample + i < totalSamples;
      i++
    ) {
      const globalSample = measureStartSample + i
      const t = globalSample / sampleRate
      const measureProgress = i / samplesPerMeasure
      const beatProgress = (i % (secondsPerBeat * sampleRate)) / (secondsPerBeat * sampleRate)
      const sixteenthProgress = (i % ((secondsPerBeat / 4) * sampleRate)) / ((secondsPerBeat / 4) * sampleRate)

      let sampleL = 0
      let sampleR = 0

      // 1. LAYER: Sub Bass
      const bassEnv = Math.exp(-beatProgress * 2.5)
      const bassWave = Math.sin(2 * Math.PI * rootFreq * t) + Math.sin(2 * Math.PI * (rootFreq / 2) * t) * 0.5
      const bass = bassWave * bassEnv * 0.35
      sampleL += bass
      sampleR += bass

      // 2. LAYER: Polyphonic Synth Pad & Chords (Stereo detuned)
      let padL = 0
      let padR = 0
      for (const note of currentChord) {
        const freq = NOTE_FREQ[note] || 220
        // Detuned oscillators
        const osc1 = Math.sin(2 * Math.PI * (freq - 0.75) * t)
        const osc2 = Math.sin(2 * Math.PI * (freq + 0.75) * t)
        const oscSub = Math.sin(2 * Math.PI * freq * t) * 0.4
        padL += osc1 + oscSub
        padR += osc2 + oscSub
      }
      const padMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * config.filterModSpeed * t)
      const padEnv = Math.sin(measureProgress * Math.PI) * 0.15 * padMod
      sampleL += padL * padEnv
      sampleR += padR * padEnv

      // 3. LAYER: Arpeggiator Melodies
      if (config.arpNotes.length > 0 && config.drumPattern !== 'ambient') {
        const arpIndex = Math.floor((t / (secondsPerBeat / 4)) % config.arpNotes.length)
        const arpFreq = NOTE_FREQ[config.arpNotes[arpIndex]] || 440
        const arpEnv = Math.exp(-sixteenthProgress * 8)
        const arpWave = Math.sin(2 * Math.PI * arpFreq * t) + Math.sin(2 * Math.PI * arpFreq * 2 * t) * 0.2
        const arp = arpWave * arpEnv * 0.12
        // Stereo ping-pong
        if (arpIndex % 2 === 0) {
          sampleL += arp * 1.2
          sampleR += arp * 0.4
        } else {
          sampleL += arp * 0.4
          sampleR += arp * 1.2
        }
      }

      // 4. LAYER: Percussion & Rhythm
      if (config.drumPattern === 'tech' || config.drumPattern === 'upbeat') {
        const beatNum = Math.floor(measureProgress * 4) // 0, 1, 2, 3

        // Kick drum on beats 0, 1, 2, 3 (Four-on-the-floor)
        const kickPitch = Math.max(45, 140 * Math.exp(-beatProgress * 25))
        const kickEnv = Math.exp(-beatProgress * 12)
        const kick = Math.sin(2 * Math.PI * kickPitch * t) * kickEnv * 0.45
        sampleL += kick
        sampleR += kick

        // Snare/Clap on beats 1 and 3
        if (beatNum === 1 || beatNum === 3) {
          const snareEnv = Math.exp(-beatProgress * 15)
          const snareNoise = (Math.random() * 2 - 1) * snareEnv * 0.22
          sampleL += snareNoise
          sampleR += snareNoise
        }

        // Hi-hats on 16th notes
        const hatEnv = Math.exp(-sixteenthProgress * 25)
        const hatNoise = (Math.random() * 2 - 1) * hatEnv * 0.08
        sampleL += hatNoise * 0.8
        sampleR += hatNoise * 1.1
      } else if (config.drumPattern === 'cinematic') {
        // Deep cinematic boom on measure downbeat
        const boomProgress = measureProgress
        const boomPitch = Math.max(35, 90 * Math.exp(-boomProgress * 10))
        const boomEnv = Math.exp(-boomProgress * 4)
        const boom = Math.sin(2 * Math.PI * boomPitch * t) * boomEnv * 0.5
        sampleL += boom
        sampleR += boom
      }

      // Global Master Fade In & Out
      let masterGain = 0.8
      const fadeSamples = sampleRate * 1.5
      if (globalSample < fadeSamples) {
        masterGain *= globalSample / fadeSamples
      } else if (globalSample > totalSamples - fadeSamples) {
        masterGain *= (totalSamples - globalSample) / fadeSamples
      }

      // Soft Limiter / Saturation
      channelL[globalSample] = Math.tanh(sampleL * masterGain)
      channelR[globalSample] = Math.tanh(sampleR * masterGain)
    }
  }

  return { channelL, channelR, sampleRate }
}

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data

  if (type === 'GENERATE') {
    try {
      self.postMessage({
        type: 'PROGRESS',
        progress: 30,
        message: 'Synthesizing harmonic progression & bassline...',
      })

      const { channelL, channelR, sampleRate } = generateStereoMusicTrack(payload)

      self.postMessage({
        type: 'PROGRESS',
        progress: 85,
        message: 'Applying stereo width & master limiter...',
      })

      self.postMessage({
        type: 'RESULT',
        channelL,
        channelR,
        sampleRate,
        durationSec: channelL.length / sampleRate,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      self.postMessage({
        type: 'ERROR',
        error: `Music generation failed: ${msg}`,
      })
    }
  }
}
