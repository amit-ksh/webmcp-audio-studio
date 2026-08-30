import { z } from 'zod'

export const VideoMetadataSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  frameRate: z.number().positive().default(30),
  durationSec: z.number().nonnegative(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  hasAudio: z.boolean().default(true),
})
export type VideoMetadata = z.infer<typeof VideoMetadataSchema>

export const VideoAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('video').default('video'),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  durationSec: z.number().nonnegative(),
  createdAt: z.number(),
  metadata: VideoMetadataSchema,
  thumbnailDataUrl: z.string().optional(),
  associatedAudioAssetId: z.string().optional(),
})
export type VideoAsset = z.infer<typeof VideoAssetSchema>

export const ImportVideoRequestSchema = z.object({
  name: z.string().optional(),
})
export type ImportVideoRequest = z.infer<typeof ImportVideoRequestSchema>

export const ExtractAudioRequestSchema = z.object({
  assetId: z.string().min(1, 'Video asset ID is required'),
})
export type ExtractAudioRequest = z.infer<typeof ExtractAudioRequestSchema>

export const VideoFrameRequestSchema = z.object({
  assetId: z.string().min(1, 'Video asset ID is required'),
  timeSec: z.number().nonnegative().default(0),
})
export type VideoFrameRequest = z.infer<typeof VideoFrameRequestSchema>

export const VideoAssetReferenceSchema = z.object({
  assetId: z.string(),
  name: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  durationSec: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
})
export type VideoAssetReference = z.infer<typeof VideoAssetReferenceSchema>
