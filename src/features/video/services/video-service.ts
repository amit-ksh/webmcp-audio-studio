import {
  saveVideoAsset,
  getVideoAssetMeta,
  getVideoAssetBlob,
  deleteVideoAsset,
  saveAsset,
} from '../../../storage/indexed-db'
import { getAudioContext } from '../../../audio/audio-context'
import { cacheAudioBuffer } from '../../../audio/audio-buffer-pool'
import { audioBufferToWav } from '../../../audio/exporters/wav-exporter'
import { useProjectStore } from '../../../stores/project-store'
import { useVideoStore } from '../../../stores/video-store'
import type { VideoAsset, VideoMetadata } from '../../../contracts/video'
import type { AudioAsset } from '../../../contracts/project'
import { generateId } from '../../../lib/utils'

export interface FrameCaptureResult {
  assetId: string
  timeSec: number
  width: number
  height: number
  dataUrl: string
}

class VideoService {
  /**
   * Reads video file and extracts metadata + poster thumbnail via offscreen canvas
   */
  public async parseVideoMetadata(
    file: File | Blob,
    mimeType: string,
  ): Promise<{
    metadata: VideoMetadata
    thumbnailDataUrl: string
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const tempUrl = URL.createObjectURL(file)
      video.src = tempUrl
      video.muted = true
      video.playsInline = true
      video.preload = 'metadata'

      const cleanup = () => {
        URL.revokeObjectURL(tempUrl)
        video.removeAttribute('src')
        video.load()
      }

      video.onloadedmetadata = async () => {
        const width = video.videoWidth || 1280
        const height = video.videoHeight || 720
        const durationSec = isFinite(video.duration) ? video.duration : 0

        // Check if there's audio by testing AudioContext decode
        let hasAudio = true
        try {
          const arrayBuffer = await file.slice(0, Math.min(file.size, 1024 * 1024 * 8)).arrayBuffer()
          const ctx = getAudioContext()
          await ctx.decodeAudioData(arrayBuffer.slice(0))
        } catch {
          // If partial slice decode fails or has no audio channel, check full or default
          hasAudio = true
        }

        // Seek to capture thumbnail
        const seekTarget = Math.min(1.0, durationSec > 0 ? durationSec / 4 : 0)
        video.currentTime = seekTarget

        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas')
            // Thumbnail with aspect ratio clamped to max 480px width
            const scale = Math.min(1, 480 / width)
            canvas.width = Math.round(width * scale)
            canvas.height = Math.round(height * scale)

            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8)
              cleanup()

              resolve({
                metadata: {
                  width,
                  height,
                  frameRate: 30,
                  durationSec,
                  mimeType,
                  sizeBytes: file.size,
                  hasAudio,
                },
                thumbnailDataUrl,
              })
              return
            }
          } catch (err) {
            console.warn('Could not generate video thumbnail canvas:', err)
          }

          cleanup()
          resolve({
            metadata: {
              width,
              height,
              frameRate: 30,
              durationSec,
              mimeType,
              sizeBytes: file.size,
              hasAudio,
            },
            thumbnailDataUrl: '',
          })
        }
      }

      video.onerror = (err) => {
        cleanup()
        reject(new Error(`Failed to load video metadata: ${video.error?.message || err}`))
      }
    })
  }

  /**
   * Import video file into IndexedDB and Zustand store
   */
  public async importVideo(file: File): Promise<VideoAsset> {
    const validMimes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-matroska',
      'video/avi',
    ]

    const mime = file.type || 'video/mp4'
    const isMimeValid =
      validMimes.some((m) => mime.includes(m.split('/')[1])) ||
      /\.(mp4|webm|mov|mkv|ogg|avi|m4v)$/i.test(file.name)

    if (!isMimeValid) {
      throw new Error(`Unsupported video format: "${file.name}" (${file.type}). Supported formats: MP4, WebM, MOV, MKV, OGG.`)
    }

    const { metadata, thumbnailDataUrl } = await this.parseVideoMetadata(file, mime)
    const assetId = generateId('asset_video')

    const videoAsset: VideoAsset = {
      id: assetId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: 'video',
      mimeType: mime,
      sizeBytes: file.size,
      durationSec: metadata.durationSec,
      createdAt: Date.now(),
      metadata,
      thumbnailDataUrl,
    }

    // Persist to IndexedDB
    await saveVideoAsset(videoAsset, file)

    // Update store
    useVideoStore.getState().addVideo(videoAsset)

    return videoAsset
  }

  /**
   * Extract audio directly from video binary using browser Web Audio decoding
   */
  public async extractAudioFromVideo(videoAssetId: string): Promise<AudioAsset> {
    const blob = await getVideoAssetBlob(videoAssetId)
    if (!blob) {
      throw new Error(`Video asset not found in storage: ${videoAssetId}`)
    }

    const videoMeta = await getVideoAssetMeta(videoAssetId)
    if (!videoMeta) {
      throw new Error(`Video metadata not found: ${videoAssetId}`)
    }

    const arrayBuffer = await blob.arrayBuffer()
    const ctx = getAudioContext()

    let decoded: AudioBuffer
    try {
      decoded = await ctx.decodeAudioData(arrayBuffer.slice(0))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(
        `Failed to decode audio track from video "${videoMeta.name}". The video may contain no audio or an unsupported browser audio codec. (${msg})`,
        { cause: err },
      )
    }

    if (decoded.numberOfChannels === 0 || decoded.duration === 0) {
      throw new Error(`The video "${videoMeta.name}" contains no audio data or has 0 channels.`)
    }

    // Convert to standard 16-bit WAV blob
    const wavBlob = audioBufferToWav(decoded)
    const audioAssetId = generateId('asset_import')

    const audioAsset: AudioAsset = {
      id: audioAssetId,
      name: `${videoMeta.name} (Extracted Audio)`,
      type: 'import',
      mimeType: 'audio/wav',
      durationSec: decoded.duration,
      sampleRate: decoded.sampleRate,
      channels: decoded.numberOfChannels,
      sizeBytes: wavBlob.size,
      createdAt: Date.now(),
      metadata: {
        sourceVideoAssetId: videoAssetId,
      },
    }

    // Cache decoded buffer in memory pool for zero-latency playback & timeline insertion
    cacheAudioBuffer(audioAssetId, decoded)

    // Save audio asset and binary blob in IndexedDB
    await saveAsset(audioAsset, wavBlob)

    // Add to project audio store
    useProjectStore.getState().addAsset(audioAsset)

    // Update video asset with associated audio asset ID
    const updatedVideo: VideoAsset = {
      ...videoMeta,
      associatedAudioAssetId: audioAssetId,
    }
    await saveVideoAsset(updatedVideo, blob)
    useVideoStore.getState().updateVideo(videoAssetId, { associatedAudioAssetId: audioAssetId })

    return audioAsset
  }

  /**
   * Seeks to a specific timestamp in the video and extracts a canvas frame
   */
  public async captureVideoFrame(
    videoAssetId: string,
    timeSec: number,
  ): Promise<FrameCaptureResult> {
    const blob = await getVideoAssetBlob(videoAssetId)
    if (!blob) {
      throw new Error(`Video asset not found in storage: ${videoAssetId}`)
    }

    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const tempUrl = URL.createObjectURL(blob)
      video.src = tempUrl
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'

      const cleanup = () => {
        URL.revokeObjectURL(tempUrl)
        video.removeAttribute('src')
        video.load()
      }

      video.onloadedmetadata = () => {
        const clampedTime = Math.max(0, Math.min(timeSec, video.duration || 0))
        video.currentTime = clampedTime

        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth || 1280
            canvas.height = video.videoHeight || 720

            const ctx = canvas.getContext('2d')
            if (!ctx) {
              cleanup()
              reject(new Error('Failed to create 2D rendering context for frame capture'))
              return
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

            cleanup()
            resolve({
              assetId: videoAssetId,
              timeSec: clampedTime,
              width: canvas.width,
              height: canvas.height,
              dataUrl,
            })
          } catch (err) {
            cleanup()
            reject(new Error(`Frame capture failed: ${err}`))
          }
        }
      }

      video.onerror = (err) => {
        cleanup()
        reject(new Error(`Failed to load video for frame capture: ${video.error?.message || err}`))
      }
    })
  }

  /**
   * Delete video asset and cleanup store
   */
  public async deleteVideo(videoAssetId: string): Promise<void> {
    await deleteVideoAsset(videoAssetId)
    useVideoStore.getState().removeVideo(videoAssetId)
  }
}

export const videoService = new VideoService()
