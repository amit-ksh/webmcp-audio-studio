import { z } from 'zod'

export const VoiceoverRequestSchema = z.object({
  text: z.string().min(1, 'Text must not be empty'),
  voiceId: z.string().default('narrator_male'),
  speed: z.number().min(0.25).max(3.0).default(1.0),
  pitch: z.number().min(0.5).max(2.0).default(1.0),
  autoInsertToTimeline: z.boolean().default(true),
  targetTrackId: z.string().optional(),
  startSec: z.number().optional(),
})
export type VoiceoverRequest = z.infer<typeof VoiceoverRequestSchema>

export const MusicMoodSchema = z.enum([
  'energetic_tech',
  'cinematic_reveal',
  'ambient_minimal',
  'upbeat_fun',
])
export type MusicMood = z.infer<typeof MusicMoodSchema>

export const MusicRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  mood: MusicMoodSchema.default('energetic_tech'),
  durationSec: z.number().min(3).max(180).default(30),
  bpm: z.number().min(60).max(180).default(120),
  autoInsertToTimeline: z.boolean().default(true),
  targetTrackId: z.string().optional(),
  startSec: z.number().optional(),
})
export type MusicRequest = z.infer<typeof MusicRequestSchema>

export const TranscriptionRequestSchema = z.object({
  assetId: z.string(),
  language: z.string().default('en'),
})
export type TranscriptionRequest = z.infer<typeof TranscriptionRequestSchema>

export const ExportRequestSchema = z.object({
  format: z.enum(['wav']).default('wav'),
  bitDepth: z.enum(['16', '24', '32']).default('16'),
  sampleRate: z.number().default(44100),
  fileName: z.string().optional(),
})
export type ExportRequest = z.infer<typeof ExportRequestSchema>

export const CommandResultSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  error: z.string().optional(),
})
export type CommandResult<T = unknown> = {
  success: boolean
  message?: string
  data?: T
  error?: string
}
