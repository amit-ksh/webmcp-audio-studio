import React, { useState, useRef } from 'react'
import { Upload, Loader2, AlertCircle, Video } from 'lucide-react'
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
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.webm,.mov,.mkv,.ogg"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isImporting && fileInputRef.current?.click()}
        className={`studio-card w-full max-w-lg p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-5 ${
          isDragging ? 'scale-[1.01] ring-2 ring-blue-500' : 'hover:border-blue-500/40'
        }`}
        style={{
          borderStyle: 'dashed',
          borderWidth: '2px',
          borderColor: isDragging ? 'var(--accent)' : 'var(--border)',
        }}
      >
        {isImporting ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Ingesting video & extracting audio…
            </p>
            <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
              Decoding frames & audio waveform in browser
            </span>
          </div>
        ) : (
          <>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-105"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--accent)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
              }}
            >
              <Video className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                Upload a video
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Drag & drop your video here to start editing
              </p>
            </div>

            <div className="flex items-center gap-3 w-full max-w-xs">
              <div className="h-[1px] flex-1" style={{ backgroundColor: 'var(--border)' }} />
              <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                or
              </span>
              <div className="h-[1px] flex-1" style={{ backgroundColor: 'var(--border)' }} />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              className="btn btn-primary text-xs px-5 py-2.5 rounded-xl shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>Choose video</span>
            </button>

            <span className="text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
              MP4 • WebM • MOV
            </span>
          </>
        )}
      </div>

      {errorMessage && (
        <div
          className="mt-4 p-3 rounded-xl text-xs flex items-center gap-2 max-w-lg w-full"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
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
