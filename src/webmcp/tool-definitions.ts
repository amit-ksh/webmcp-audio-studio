import type { WebMCPToolDefinition } from './types'

export const WEBMCP_TOOLS: WebMCPToolDefinition[] = [
  {
    name: 'get_project_state',
    description:
      'Inspect the current audio project state, timeline tracks, clips, ducking settings, master volume, and imported/generated assets.',
    readOnlyHint: true,
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'transcribe_audio_asset',
    description:
      'Run in-browser Whisper Speech-to-Text inference on a specific audio asset to produce timestamped transcription segments.',
    readOnlyHint: false,
    parameters: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The unique ID of the target audio asset.',
        },
        language: {
          type: 'string',
          description: 'Language code for transcription (e.g. "en", "es", "fr"). Defaults to "en".',
        },
      },
      required: ['assetId'],
    },
  },
  {
    name: 'generate_voiceover',
    description:
      'Synthesize a vocal narration track from text using multi-timbre neural speech generation and automatically add to timeline.',
    readOnlyHint: false,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The narration or script text to synthesize.',
        },
        voiceId: {
          type: 'string',
          description:
            'Voice persona: "narrator_male", "narrator_female", "energetic_launch", or "executive_calm".',
        },
        speed: {
          type: 'number',
          description: 'Speech speed multiplier (0.5 to 1.75). Defaults to 1.0.',
        },
        pitch: {
          type: 'number',
          description: 'Pitch adjustment factor (0.75 to 1.25). Defaults to 1.0.',
        },
        autoInsertToTimeline: {
          type: 'boolean',
          description: 'Whether to immediately place the generated voiceover clip onto the Voiceover Track.',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'generate_music',
    description:
      'Generate a stereo backing track with synthesized bass, chords, arps, and percussion matching the requested mood.',
    readOnlyHint: false,
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Text description of the desired music backing track.',
        },
        mood: {
          type: 'string',
          enum: ['energetic_tech', 'cinematic_reveal', 'ambient_minimal', 'upbeat_fun'],
          description: 'Mood harmonic preset.',
        },
        durationSec: {
          type: 'number',
          description: 'Length of the generated track in seconds (10 to 120). Defaults to 30.',
        },
        bpm: {
          type: 'number',
          description: 'Tempo in BPM (70 to 160). Defaults to 120.',
        },
        autoInsertToTimeline: {
          type: 'boolean',
          description: 'Whether to place the clip onto the Backing Music Track.',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'update_audio_track',
    description:
      'Modify track or clip positioning, gain, mute, or solo states on the timeline.',
    readOnlyHint: false,
    parameters: {
      type: 'object',
      properties: {
        clipId: {
          type: 'string',
          description: 'The ID of the clip to adjust.',
        },
        startSec: {
          type: 'number',
          description: 'New start timestamp in seconds on the timeline.',
        },
        gainDb: {
          type: 'number',
          description: 'Gain adjustment in decibels (e.g. -6 for -6dB).',
        },
        trackId: {
          type: 'string',
          description: 'Target track ID for track-level adjustments.',
        },
        muted: {
          type: 'boolean',
          description: 'Set track mute state.',
        },
        solo: {
          type: 'boolean',
          description: 'Set track solo state.',
        },
      },
    },
  },
  {
    name: 'mix_audio_project',
    description:
      'Configure sidechain music ducking amount and master bus gain for the project mix.',
    readOnlyHint: false,
    parameters: {
      type: 'object',
      properties: {
        duckingAmountDb: {
          type: 'number',
          description:
            'Decibels to attenuate music during voiceover (e.g. -14 for -14dB). Range: -30 to -3.',
        },
        masterGain: {
          type: 'number',
          description: 'Master output bus linear volume (0.0 to 1.5).',
        },
      },
    },
  },
  {
    name: 'export_audio',
    description:
      'Render the full multi-track project with volume curves and sidechain ducking into a 16-bit PCM WAV master file.',
    readOnlyHint: false,
    parameters: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['wav'],
          description: 'Audio format. Defaults to "wav".',
        },
      },
    },
  },
]
