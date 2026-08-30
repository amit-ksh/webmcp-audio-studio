import { z } from 'zod'

export const TrackTypeSchema = z.enum(['voiceover', 'music', 'sfx'])
export type TrackType = z.infer<typeof TrackTypeSchema>

export const AudioAssetTypeSchema = z.enum(['import', 'voiceover', 'music', 'sfx'])
export type AudioAssetType = z.infer<typeof AudioAssetTypeSchema>

export const TranscriptSegmentSchema = z.object({
  id: z.string(),
  start: z.number(),
  end: z.number(),
  text: z.string(),
  confidence: z.number().optional(),
})
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>

export const TranscriptSchema = z.object({
  assetId: z.string(),
  text: z.string(),
  segments: z.array(TranscriptSegmentSchema),
  language: z.string().default('en'),
  createdAt: z.number(),
})
export type Transcript = z.infer<typeof TranscriptSchema>

export const AudioAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: AudioAssetTypeSchema,
  mimeType: z.string(),
  durationSec: z.number(),
  sampleRate: z.number(),
  channels: z.number(),
  sizeBytes: z.number(),
  createdAt: z.number(),
  transcript: TranscriptSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type AudioAsset = z.infer<typeof AudioAssetSchema>

export const ClipSchema = z.object({
  id: z.string(),
  trackId: z.string(),
  assetId: z.string(),
  name: z.string(),
  startSec: z.number(),
  durationSec: z.number(),
  offsetSec: z.number().default(0),
  gain: z.number().default(1.0),
  fadeInSec: z.number().default(0),
  fadeOutSec: z.number().default(0),
  color: z.string().optional(),
})
export type Clip = z.infer<typeof ClipSchema>

export const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: TrackTypeSchema,
  gain: z.number().default(1.0),
  pan: z.number().default(0),
  muted: z.boolean().default(false),
  solo: z.boolean().default(false),
  clips: z.array(ClipSchema).default([]),
})
export type Track = z.infer<typeof TrackSchema>

export const DuckingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  duckingAmountDb: z.number().default(-14),
  attackSec: z.number().default(0.05),
  releaseSec: z.number().default(0.3),
  thresholdDb: z.number().default(-30),
})
export type DuckingConfig = z.infer<typeof DuckingConfigSchema>

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  durationSec: z.number().default(60),
  sampleRate: z.number().default(44100),
  tracks: z.array(TrackSchema),
  ducking: DuckingConfigSchema.default({
    enabled: true,
    duckingAmountDb: -14,
    attackSec: 0.05,
    releaseSec: 0.3,
    thresholdDb: -30,
  }),
  masterGain: z.number().default(1.0),
})
export type Project = z.infer<typeof ProjectSchema>

export const GenerationJobSchema = z.object({
  id: z.string(),
  type: z.enum(['transcription', 'voiceover', 'music']),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  progress: z.number().min(0).max(100).default(0),
  message: z.string().optional(),
  error: z.string().optional(),
  resultAssetId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})
export type GenerationJob = z.infer<typeof GenerationJobSchema>
