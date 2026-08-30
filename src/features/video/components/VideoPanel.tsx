import React from 'react'
import { Film } from 'lucide-react'
import { VideoUploader } from './VideoUploader'
import { VideoPlayer } from './VideoPlayer'
import { VideoMetadata } from './VideoMetadata'
import { VideoAssetList } from './VideoAssetList'
import { useVideoStore } from '../../../stores/video-store'

export const VideoPanel: React.FC = () => {
  const { videos, selectedVideoId } = useVideoStore()
  const hasSelectedVideo = Boolean(selectedVideoId && videos.some((v) => v.id === selectedVideoId))

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto font-sans gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 shadow-sm">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Video Workspace
            </h2>
            <p className="text-xs text-slate-400">Local Browser Ingestion & Audio Extraction</p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
          {videos.length} video{videos.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Video Dropzone */}
      <VideoUploader />

      {/* Video Preview Player (when video selected) */}
      {hasSelectedVideo && (
        <div className="flex flex-col gap-3">
          <VideoPlayer />
          <VideoMetadata />
        </div>
      )}

      {/* Video Asset List */}
      <VideoAssetList />
    </div>
  )
}
