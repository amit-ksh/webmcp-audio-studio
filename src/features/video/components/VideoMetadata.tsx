import React from 'react'
import { Info, Check, X, HardDrive, Film, Clock, Layers } from 'lucide-react'
import { useVideoStore } from '../../../stores/video-store'
import { formatTime } from '../../../lib/utils'

export const VideoMetadata: React.FC = () => {
  const { videos, selectedVideoId } = useVideoStore()
  const activeVideo = videos.find((v) => v.id === selectedVideoId)

  if (!activeVideo) return null

  const { metadata } = activeVideo
  const aspectRatio =
    metadata.width && metadata.height
      ? `${(metadata.width / metadata.height).toFixed(2)}:1`
      : '16:9'

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-slate-200">
        <Info className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider">Video Technical Inspector</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" /> Resolution
          </span>
          <span className="text-slate-200 font-semibold">
            {metadata.width} x {metadata.height}
          </span>
          <span className="text-[10px] text-slate-400">Aspect Ratio: {aspectRatio}</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" /> Duration & FPS
          </span>
          <span className="text-slate-200 font-semibold">
            {formatTime(metadata.durationSec)} ({metadata.durationSec.toFixed(1)}s)
          </span>
          <span className="text-[10px] text-slate-400">{metadata.frameRate} Frames/Sec</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-amber-400" /> Storage & Size
          </span>
          <span className="text-slate-200 font-semibold">
            {(metadata.sizeBytes / (1024 * 1024)).toFixed(2)} MB
          </span>
          <span className="text-[10px] text-slate-400">IndexedDB: Local</span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Film className="w-3 h-3 text-emerald-400" /> Format / Audio
          </span>
          <span className="text-slate-200 font-semibold truncate" title={metadata.mimeType}>
            {metadata.mimeType}
          </span>
          <span className="text-[10px] flex items-center gap-1 text-slate-300">
            Audio Track:
            {metadata.hasAudio ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Yes
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-0.5">
                <X className="w-3 h-3" /> No
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 flex flex-col gap-1 text-[11px]">
        <div className="flex justify-between text-slate-400">
          <span>Asset ID:</span>
          <span className="font-mono text-slate-300 truncate max-w-[180px]">{activeVideo.id}</span>
        </div>
        {activeVideo.associatedAudioAssetId && (
          <div className="flex justify-between text-slate-400">
            <span>Linked Audio ID:</span>
            <span className="font-mono text-cyan-400 truncate max-w-[180px]">
              {activeVideo.associatedAudioAssetId}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
