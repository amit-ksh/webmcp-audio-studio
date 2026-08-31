import type { Project } from '../../contracts/project'
import { getVideoAssetBlob } from '../../storage/indexed-db'
import { renderTrackScopeToAudioBuffer } from './audio-exporter'

export interface VideoExportOptions {
  project: Project
  videoAssetId: string
  format?: 'mp4' | 'webm'
  onProgress?: (progress: number, message: string) => void
}

export interface VideoExportResult {
  blob: Blob
  mimeType: string
  extension: string
  durationSec: number
}

/**
 * Composite video and multi-track audio mixdown in browser using Canvas/Video stream and MediaRecorder
 */
export async function exportVideoWithAudio(
  options: VideoExportOptions,
): Promise<VideoExportResult> {
  const { project, videoAssetId, format = 'mp4', onProgress } = options

  onProgress?.(5, 'Loading video asset...')
  const videoBlob = await getVideoAssetBlob(videoAssetId)
  if (!videoBlob) {
    throw new Error('Video asset not found in storage')
  }

  onProgress?.(15, 'Rendering audio mixdown...')
  const audioBuffer = await renderTrackScopeToAudioBuffer(project, 'all', 44100)

  onProgress?.(30, 'Preparing video compositor...')
  const videoUrl = URL.createObjectURL(videoBlob)
  const videoEl = document.createElement('video')
  videoEl.src = videoUrl
  videoEl.muted = true
  videoEl.playsInline = true
  videoEl.preload = 'auto'

  await new Promise<void>((resolve, reject) => {
    videoEl.onloadedmetadata = () => resolve()
    videoEl.onerror = (e) => reject(new Error(`Failed to load video: ${e}`))
  })

  const durationSec = Math.min(videoEl.duration || project.durationSec, Math.max(project.durationSec, audioBuffer.duration))
  const width = videoEl.videoWidth || 1280
  const height = videoEl.videoHeight || 720

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    URL.revokeObjectURL(videoUrl)
    throw new Error('Could not create canvas context for video export')
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
    sampleRate: 44100,
  })
  const audioSource = audioCtx.createBufferSource()
  audioSource.buffer = audioBuffer

  const audioDestination = audioCtx.createMediaStreamDestination()
  audioSource.connect(audioDestination)

  // Capture canvas video stream
  const canvasStream = canvas.captureStream(30)
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioDestination.stream.getAudioTracks(),
  ])

  // Select supported mimeType
  let selectedMime = 'video/webm;codecs=vp9,opus'
  let extension = 'webm'

  if (format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a')) {
    selectedMime = 'video/mp4;codecs=avc1,mp4a'
    extension = 'mp4'
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    selectedMime = 'video/webm;codecs=vp9,opus'
    extension = 'webm'
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    selectedMime = 'video/webm;codecs=vp8,opus'
    extension = 'webm'
  } else if (MediaRecorder.isTypeSupported('video/webm')) {
    selectedMime = 'video/webm'
    extension = 'webm'
  } else if (MediaRecorder.isTypeSupported('video/mp4')) {
    selectedMime = 'video/mp4'
    extension = 'mp4'
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: selectedMime,
    videoBitsPerSecond: 6000000,
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data)
    }
  }

  return new Promise((resolve, reject) => {
    let animId: number
    let isFinished = false

    const cleanup = () => {
      isFinished = true
      cancelAnimationFrame(animId)
      URL.revokeObjectURL(videoUrl)
      videoEl.removeAttribute('src')
      videoEl.load()
      try {
        audioSource.stop()
        audioCtx.close()
      } catch {
        // Ignored
      }
      combinedStream.getTracks().forEach((t) => t.stop())
    }

    recorder.onstop = () => {
      cleanup()
      const outputBlob = new Blob(chunks, { type: selectedMime })
      onProgress?.(100, 'Video export complete!')
      resolve({
        blob: outputBlob,
        mimeType: selectedMime,
        extension,
        durationSec,
      })
    }

    recorder.onerror = (err) => {
      cleanup()
      reject(new Error(`Recording error: ${err}`))
    }

    // Start playback and recording
    videoEl.currentTime = 0
    onProgress?.(40, 'Rendering video & audio frames...')

    recorder.start(500)
    audioSource.start(0)
    videoEl.play().catch((err) => {
      cleanup()
      reject(err)
    })

    const drawFrame = () => {
      if (isFinished) return

      ctx.drawImage(videoEl, 0, 0, width, height)

      const currentTime = videoEl.currentTime
      const progressPercent = Math.min(95, Math.round(40 + (currentTime / durationSec) * 55))
      onProgress?.(progressPercent, `Rendering frames: ${currentTime.toFixed(1)}s / ${durationSec.toFixed(1)}s`)

      if (currentTime >= durationSec || videoEl.ended) {
        recorder.stop()
        return
      }

      animId = requestAnimationFrame(drawFrame)
    }

    animId = requestAnimationFrame(drawFrame)
  })
}
