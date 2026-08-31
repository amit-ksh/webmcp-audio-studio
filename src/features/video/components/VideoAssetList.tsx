import React, { useState } from 'react'
import {
  Film,
  Play,
  Music,
  Trash2,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { useVideoStore } from '../../../stores/video-store'
import { usePlaybackStore } from '../../../stores/playback-store'
import { commandBus } from '../../../webmcp/bus'
import { formatTime } from '../../../lib/utils'
import type { VideoAsset } from '../../../contracts/video'

export const VideoAssetList: React.FC = () => {
  const { videos, selectedVideoId, selectVideo } = useVideoStore()
  const { setSidebarTab } = usePlaybackStore()
  const [extractingId, setExtractingId] = useState<string | null>(null)

  const handleExtractAudio = async (video: VideoAsset, e: React.MouseEvent) => {
    e.stopPropagation()
    if (extractingId) return
    setExtractingId(video.id)

    try {
      const res = await commandBus.execute({
        type: 'video.extractAudio',
        payload: { videoAssetId: video.id },
      })

      if (!res.success) {
        alert(res.error || 'Failed to extract audio')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Audio extraction error: ${msg}`)
    } finally {
      setExtractingId(null)
    }
  }

  const handleDeleteVideo = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this video asset from browser storage?')) {
      await commandBus.execute({
        type: 'video.delete',
        payload: { videoAssetId: videoId },
      })
    }
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-xs bg-slate-900/30 rounded-xl border border-slate-800/40 p-4">
        <Film className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
        <p className="font-semibold text-slate-400">No video assets imported yet</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Upload a product demo or video clip above to preview and extract audio.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Imported Videos ({videos.length})
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {videos.map((video) => {
          const isSelected = selectedVideoId === video.id
          const isExtracting = extractingId === video.id

          return (
            <div
              key={video.id}
              onClick={() => selectVideo(video.id)}
              className={`rounded-xl p-3 flex flex-col gap-2.5 transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-slate-900/90 border-cyan-500/50 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/20'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              {/* Top Row: Thumbnail + Info */}
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="relative w-24 aspect-video bg-black rounded-lg overflow-hidden flex-shrink-0 border border-slate-800">
                  {video.thumbnailDataUrl ? (
                    <img
                      src={video.thumbnailDataUrl}
                      alt={video.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-600">
                      <Film className="w-5 h-5" />
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-200">
                    {formatTime(video.durationSec)}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-100 truncate" title={video.name}>
                      {video.name}
                    </p>
                    <button
                      onClick={(e) => handleDeleteVideo(video.id, e)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors flex-shrink-0"
                      title="Delete video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {video.metadata.width}x{video.metadata.height} • {(video.sizeBytes / (1024 * 1024)).toFixed(1)} MB • {video.metadata.frameRate} fps
                  </p>

                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {video.metadata.hasAudio ? (
                      <span className="badge badge-emerald text-[9px]">Audio Present</span>
                    ) : (
                      <span className="badge badge-amber text-[9px]">No Audio</span>
                    )}

                    {video.associatedAudioAssetId && (
                      <span className="badge badge-cyan text-[9px] flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> Extracted
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      selectVideo(video.id)
                    }}
                    className={`btn text-[11px] py-1 px-2.5 ${
                      isSelected
                        ? 'btn-primary bg-cyan-500 text-slate-950 font-bold'
                        : 'btn-secondary text-slate-300'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    {isSelected ? 'Previewing' : 'Preview'}
                  </button>

                  <button
                    onClick={(e) => handleExtractAudio(video, e)}
                    disabled={isExtracting || !video.metadata.hasAudio}
                    className="btn btn-secondary text-[11px] py-1 px-2.5 text-indigo-300 hover:text-white"
                    title="Extract audio soundtrack"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Extracting...
                      </>
                    ) : (
                      <>
                        <Music className="w-3 h-3" /> Extract Audio
                      </>
                    )}
                  </button>
                </div>

                {video.associatedAudioAssetId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSidebarTab('transcription')
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                    title="Transcribe extracted audio"
                  >
                    Transcribe →
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
