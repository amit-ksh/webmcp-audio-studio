import React, { useState } from 'react'
import { X, Download, Film, Music, Check, Loader2, AlertCircle } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { useVideoStore } from '../../stores/video-store'
import { exportVideoWithAudio } from '../../audio/exporters/video-exporter'
import { exportScopedAudioWav } from '../../audio/exporters/audio-exporter'
import { downloadBlob } from '../../audio/exporters/wav-exporter'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

type ExportTarget = 'video_audio' | 'voiceover_only' | 'music_only' | 'all_audio'
type VideoFormat = 'mp4' | 'webm'
type AudioFormat = 'wav' | 'mp3'

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const currentProject = useProjectStore((state) => state.currentProject)
  const selectedVideoId = useVideoStore((state) => state.selectedVideoId)

  const [exportTarget, setExportTarget] = useState<ExportTarget>('video_audio')
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('mp4')
  const [audioFormat, setAudioFormat] = useState<AudioFormat>('wav')

  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [readyResult, setReadyResult] = useState<{
    blob: Blob
    filename: string
    isVideo: boolean
  } | null>(null)

  if (!isOpen || !currentProject) return null

  const isVideoTarget = exportTarget === 'video_audio'

  const handleExport = async () => {
    setIsProcessing(true)
    setError(null)
    setReadyResult(null)
    setProgress(5)
    setProgressMessage('Preparing export…')

    const projectNameClean = currentProject.name.replace(/\s+/g, '_')

    try {
      if (isVideoTarget) {
        if (!selectedVideoId) {
          throw new Error('Please upload or select a video before exporting video')
        }

        const result = await exportVideoWithAudio({
          project: currentProject,
          videoAssetId: selectedVideoId,
          format: videoFormat,
          onProgress: (p, msg) => {
            setProgress(p)
            setProgressMessage(msg)
          },
        })

        const filename = `${projectNameClean}_master.${result.extension}`
        setReadyResult({ blob: result.blob, filename, isVideo: true })
        downloadBlob(result.blob, filename)
      } else {
        // Audio export
        setProgress(20)
        setProgressMessage('Rendering audio track…')

        const scope =
          exportTarget === 'voiceover_only'
            ? 'voiceover'
            : exportTarget === 'music_only'
              ? 'music'
              : 'all'

        const blob = await exportScopedAudioWav(currentProject, scope)
        setProgress(100)
        setProgressMessage('Audio rendered!')

        const suffix =
          scope === 'voiceover'
            ? 'voiceover'
            : scope === 'music'
              ? 'music'
              : 'audio_mix'

        const filename = `${projectNameClean}_${suffix}.wav`
        setReadyResult({ blob, filename, isVideo: false })
        downloadBlob(blob, filename)
      }
    } catch (err: unknown) {
      console.error('Export failed:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualDownload = () => {
    if (readyResult) {
      downloadBlob(readyResult.blob, readyResult.filename)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog p-6 flex flex-col gap-5 bg-white border border-slate-200 shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Download className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Export Media
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ready Result State */}
        {readyResult ? (
          <div className="p-6 rounded-xl flex flex-col items-center justify-center text-center gap-3.5 bg-emerald-50/70 border border-emerald-200">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 shadow-2xs">
              <Check className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-base font-bold text-slate-900">
                {readyResult.isVideo ? 'Your video is ready!' : 'Your audio is ready!'}
              </p>
              <p className="text-xs font-mono text-slate-500">
                {readyResult.filename} ({(readyResult.blob.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>

            <button
              type="button"
              onClick={handleManualDownload}
              className="btn btn-primary text-xs px-5 py-2.5 mt-1 w-full rounded-xl font-semibold shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{readyResult.isVideo ? 'Download video again' : 'Download audio again'}</span>
            </button>
          </div>
        ) : isProcessing ? (
          /* Processing State */
          <div className="p-8 rounded-xl flex flex-col items-center justify-center gap-3.5 text-center bg-slate-50 border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-slate-900">
                {progressMessage || 'Preparing your export…'}
              </p>
              <p className="text-xs font-mono text-slate-500">
                {progress}% complete
              </p>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          /* Export Selection Form */
          <>
            {/* Target Options */}
            <div className="flex flex-col gap-4">
              {/* Video Option */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-400">
                  Video Output
                </span>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    exportTarget === 'video_audio'
                      ? 'bg-blue-50/70 border-blue-500 shadow-2xs font-semibold'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportTarget"
                    checked={exportTarget === 'video_audio'}
                    onChange={() => setExportTarget('video_audio')}
                    className="accent-blue-600"
                  />
                  <Film className="w-4 h-4 text-sky-600" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">
                      Video + Master Audio
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Combines video with voiceover & background music mix
                    </span>
                  </div>
                </label>
              </div>

              {/* Audio Options */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-400">
                  Audio Exports
                </span>

                <div className="flex flex-col gap-2">
                  <label
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                      exportTarget === 'all_audio'
                        ? 'bg-blue-50/70 border-blue-500 shadow-2xs font-semibold'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportTarget"
                      checked={exportTarget === 'all_audio'}
                      onChange={() => setExportTarget('all_audio')}
                      className="accent-blue-600"
                    />
                    <Music className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs text-slate-800 font-medium">
                      All audio master mixdown (WAV)
                    </span>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                      exportTarget === 'voiceover_only'
                        ? 'bg-blue-50/70 border-blue-500 shadow-2xs font-semibold'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportTarget"
                      checked={exportTarget === 'voiceover_only'}
                      onChange={() => setExportTarget('voiceover_only')}
                      className="accent-blue-600"
                    />
                    <span className="text-xs text-slate-800 font-medium">
                      Voiceover track only
                    </span>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                      exportTarget === 'music_only'
                        ? 'bg-blue-50/70 border-blue-500 shadow-2xs font-semibold'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportTarget"
                      checked={exportTarget === 'music_only'}
                      onChange={() => setExportTarget('music_only')}
                      className="accent-blue-600"
                    />
                    <span className="text-xs text-slate-800 font-medium">
                      Background music track only
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Format Selection */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700">
                Format
              </label>

              {isVideoTarget ? (
                <select
                  value={videoFormat}
                  onChange={(e) => setVideoFormat(e.target.value as VideoFormat)}
                  className="select text-xs w-32 py-1.5 rounded-lg border-slate-300"
                >
                  <option value="mp4">MP4 (H.264)</option>
                  <option value="webm">WebM (VP9)</option>
                </select>
              ) : (
                <select
                  value={audioFormat}
                  onChange={(e) => setAudioFormat(e.target.value as AudioFormat)}
                  className="select text-xs w-32 py-1.5 rounded-lg border-slate-300"
                >
                  <option value="wav">WAV (16-bit PCM)</option>
                  <option value="mp3">MP3</option>
                </select>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Export Primary Action Button */}
            <button
              type="button"
              onClick={handleExport}
              className="btn btn-primary text-xs py-2.5 w-full rounded-xl font-bold shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{isVideoTarget ? 'Export video file' : 'Export audio file'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
