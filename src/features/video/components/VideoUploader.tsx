import React, { useState, useRef } from 'react'
import { Upload, Video, Loader2, AlertCircle } from 'lucide-react'
import { commandBus } from '../../../webmcp/bus'

export const VideoUploader: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsImporting(true)
    setErrorMessage(null)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const res = await commandBus.execute({
          type: 'video.import',
          payload: { file },
        })

        if (!res.success) {
          setErrorMessage(res.error || 'Failed to import video')
        }
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
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isImporting && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/80'
        } ${isImporting ? 'opacity-75 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.webm,.mov,.mkv,.ogg,.avi,.m4v"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2.5">
          <div className="p-3 bg-gradient-to-tr from-cyan-900/40 to-indigo-900/40 border border-cyan-500/20 rounded-full text-cyan-400 shadow-sm">
            {isImporting ? (
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5">
              {isImporting ? (
                'Ingesting video & parsing metadata...'
              ) : (
                <>
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  Drag & Drop video here or <span className="text-cyan-400 underline">Browse</span>
                </>
              )}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              MP4, WebM, QuickTime MOV, MKV • Stored 100% locally in browser IndexedDB
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-2.5 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
