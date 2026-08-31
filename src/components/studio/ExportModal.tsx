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
        className="modal-dialog p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Export
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost text-xs p-1"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ready Result State */}
        {readyResult ? (
          <div
            className="p-5 rounded-md flex flex-col items-center justify-center text-center gap-3"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}
            >
              <Check className="w-5 h-5" />
            </div>

            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {readyResult.isVideo ? 'Your video is ready.' : 'Your audio is ready.'}
              </p>
              <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {readyResult.filename} ({(readyResult.blob.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>

            <button
              type="button"
              onClick={handleManualDownload}
              className="btn btn-primary text-xs px-4 py-2 mt-1 w-full"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{readyResult.isVideo ? 'Download video' : 'Download audio'}</span>
            </button>
          </div>
        ) : isProcessing ? (
          /* Processing State */
          <div
            className="p-6 rounded-md flex flex-col items-center justify-center gap-3 text-center"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--accent)' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                {progressMessage || 'Preparing your video…'}
              </p>
              <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {progress}% complete
              </p>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden mt-1" style={{ backgroundColor: 'var(--border)' }}>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: 'var(--accent)',
                }}
              />
            </div>
          </div>
        ) : (
          /* Export Selection Form */
          <>
            {/* Target Options */}
            <div className="flex flex-col gap-3">
              {/* Video Option */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider font-mono" style={{ color: 'var(--muted-foreground)' }}>
                  Video
                </span>

                <label
                  className={`flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-all ${
                    exportTarget === 'video_audio' ? 'font-semibold' : ''
                  }`}
                  style={{
                    backgroundColor: exportTarget === 'video_audio' ? 'var(--surface-hover)' : 'var(--surface-elevated)',
                    border: `1px solid ${exportTarget === 'video_audio' ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  <input
                    type="radio"
                    name="exportTarget"
                    checked={exportTarget === 'video_audio'}
                    onChange={() => setExportTarget('video_audio')}
                    className="accent-blue-500"
                  />
                  <Film className="w-3.5 h-3.5" style={{ color: 'var(--track-video)' }} />
                  <span className="text-xs" style={{ color: 'var(--foreground)' }}>
                    Video + Audio
                  </span>
                </label>
              </div>

              {/* Audio Options */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider font-mono" style={{ color: 'var(--muted-foreground)' }}>
                  Audio
                </span>

                <div className="flex flex-col gap-1.5">
                  <label
                    className={`flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-all ${
                      exportTarget === 'all_audio' ? 'font-semibold' : ''
                    }`}
                    style={{
                      backgroundColor: exportTarget === 'all_audio' ? 'var(--surface-hover)' : 'var(--surface-elevated)',
                      border: `1px solid ${exportTarget === 'all_audio' ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="exportTarget"
                      checked={exportTarget === 'all_audio'}
                      onChange={() => setExportTarget('all_audio')}
                      className="accent-blue-500"
                    />
                    <Music className="w-3.5 h-3.5" style={{ color: 'var(--track-music)' }} />
                    <span className="text-xs" style={{ color: 'var(--foreground)' }}>
                      All audio
                    </span>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-all ${
                      exportTarget === 'voiceover_only' ? 'font-semibold' : ''
                    }`}
                    style={{
                      backgroundColor: exportTarget === 'voiceover_only' ? 'var(--surface-hover)' : 'var(--surface-elevated)',
                      border: `1px solid ${exportTarget === 'voiceover_only' ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="exportTarget"
                      checked={exportTarget === 'voiceover_only'}
                      onChange={() => setExportTarget('voiceover_only')}
                      className="accent-blue-500"
                    />
                    <span className="text-xs" style={{ color: 'var(--foreground)' }}>
                      Voiceover only
                    </span>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-all ${
                      exportTarget === 'music_only' ? 'font-semibold' : ''
                    }`}
                    style={{
                      backgroundColor: exportTarget === 'music_only' ? 'var(--surface-hover)' : 'var(--surface-elevated)',
                      border: `1px solid ${exportTarget === 'music_only' ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="exportTarget"
                      checked={exportTarget === 'music_only'}
                      onChange={() => setExportTarget('music_only')}
                      className="accent-blue-500"
                    />
                    <span className="text-xs" style={{ color: 'var(--foreground)' }}>
                      Background music only
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Format Selection */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <label className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                Format
              </label>

              {isVideoTarget ? (
                <select
                  value={videoFormat}
                  onChange={(e) => setVideoFormat(e.target.value as VideoFormat)}
                  className="select text-xs w-28 py-1"
                >
                  <option value="mp4">MP4</option>
                  <option value="webm">WebM</option>
                </select>
              ) : (
                <select
                  value={audioFormat}
                  onChange={(e) => setAudioFormat(e.target.value as AudioFormat)}
                  className="select text-xs w-28 py-1"
                >
                  <option value="wav">WAV</option>
                  <option value="mp3">MP3</option>
                </select>
              )}
            </div>

            {error && (
              <div
                className="p-2.5 rounded-md text-xs flex items-center gap-2"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--danger)',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Export Primary Action Button */}
            <button
              type="button"
              onClick={handleExport}
              className="btn btn-primary text-xs py-2 w-full mt-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isVideoTarget ? 'Export video' : 'Export audio'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
