import React, { useState, useRef, useEffect } from 'react'
import { Upload, Loader2, AlertCircle, Video, Sparkles } from 'lucide-react'
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

  // Full window drag-and-drop listeners so user can drop anywhere on the page
  useEffect(() => {
    let dragCounter = 0

    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounter++
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDragging(true)
      }
    }

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter--
      if (dragCounter <= 0) {
        setIsDragging(false)
        dragCounter = 0
      }
    }

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault()
      dragCounter = 0
      setIsDragging(false)
      if (e.dataTransfer?.files) {
        await handleFiles(e.dataTransfer.files)
      }
    }

    window.addEventListener('dragenter', handleWindowDragEnter)
    window.addEventListener('dragleave', handleWindowDragLeave)
    window.addEventListener('dragover', handleWindowDragOver)
    window.addEventListener('drop', handleWindowDrop)

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter)
      window.removeEventListener('dragleave', handleWindowDragLeave)
      window.removeEventListener('dragover', handleWindowDragOver)
      window.removeEventListener('drop', handleWindowDrop)
    }
  }, [])

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 py-20 px-4 select-none">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.webm,.mov,.mkv,.ogg"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Dragging Full-Page Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-600/10 border-4 border-dashed border-blue-500 backdrop-blur-xs flex items-center justify-center pointer-events-none transition-all">
          <div className="bg-white/95 px-8 py-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 border border-blue-200">
            <Upload className="w-10 h-10 text-blue-600 animate-bounce" />
            <p className="text-base font-bold text-slate-800">
              Drop your video here to import
            </p>
          </div>
        </div>
      )}

      {/* Seamless Blended Upload Stage */}
      <div className="w-full max-w-xl flex flex-col items-center text-center gap-6">
        {isImporting ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-bold text-slate-900">
                Importing video & extracting audio…
              </p>
              <span className="text-xs font-mono text-slate-500">
                Decoding audio tracks and preparing studio workspace in browser
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Blended Icon */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center justify-center text-blue-600 cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200 group"
            >
              <Video className="w-9 h-9 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>

            {/* Typography */}
            <div className="flex flex-col gap-2 max-w-md">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Upload a video to start editing
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Drag & drop your video anywhere on this page, or choose a file from your device.
              </p>
            </div>

            {/* Action Button */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary text-sm px-6 py-3 rounded-xl shadow-md font-semibold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Choose video file</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                <span>MP4</span>
                <span>•</span>
                <span>WebM</span>
                <span>•</span>
                <span>MOV</span>
                <span>•</span>
                <span>MKV</span>
              </div>
            </div>

            {/* Subtle Feature Highlight Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-6 border-t border-slate-200/80 w-full max-w-md">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-3 py-1 bg-white/80 rounded-full border border-slate-200 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>AI Voiceover</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-3 py-1 bg-white/80 rounded-full border border-slate-200 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>AI Backing Music</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-3 py-1 bg-white/80 rounded-full border border-slate-200 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Auto Ducking</span>
              </div>
            </div>
          </>
        )}

        {errorMessage && (
          <div className="mt-2 p-3.5 rounded-xl text-xs flex items-center gap-2 max-w-md w-full bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  )
}
