import React, { useState, useRef } from 'react'
import { Upload, Loader2, AlertCircle } from 'lucide-react'
import { commandBus } from '../../../webmcp/bus'
import { useVideoStore } from '../../../stores/video-store'
import { useProjectStore } from '../../../stores/project-store'

interface VideoUploaderProps {
  onUploaded?: () => void
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onUploaded }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const selectVideo = useVideoStore((state) => state.selectVideo)
  const updateProjectMeta = useProjectStore((state) => state.updateProjectMeta)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsImporting(true)
    setErrorMessage(null)

    try {
      const file = files[0]
      const res = await commandBus.execute({
        type: 'video.import',
        payload: { file },
      })

      if (res.success && res.data) {
        const video = res.data as { id: string; durationSec: number }
        await selectVideo(video.id)
        updateProjectMeta({ durationSec: Math.ceil(video.durationSec || 60) })
        onUploaded?.()
      } else {
        setErrorMessage(res.error || 'Failed to import video')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(msg)
    } finally {
      setIsImporting(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    await handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 px-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className="w-full max-w-md p-10 text-center transition-all duration-150 flex flex-col items-center justify-center gap-4"
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: isDragging ? 'var(--surface-hover)' : 'var(--surface)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.webm,.mov,.mkv,.ogg"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isImporting ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Importing video…
            </p>
          </div>
        ) : (
          <>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'var(--surface-elevated)', color: 'var(--muted-foreground)' }}
            >
              <Upload className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                Upload a video
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Drag & drop your video here
              </p>
            </div>

            <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
              or
            </span>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary text-xs px-4 py-2"
            >
              Choose video
            </button>

            <span className="text-[11px] font-mono mt-1" style={{ color: 'var(--muted-foreground)' }}>
              MP4, WebM, MOV
            </span>
          </>
        )}
      </div>

      {errorMessage && (
        <div
          className="mt-4 p-3 rounded-md text-xs flex items-center gap-2 max-w-md w-full"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--danger)',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
