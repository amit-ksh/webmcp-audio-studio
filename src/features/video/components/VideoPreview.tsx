import React from 'react'
import { RefreshCw, Play, Pause, Film, FileText, Loader2 } from 'lucide-react'
import { useVideoStore } from '../../../stores/video-store'
import { usePlaybackStore } from '../../../stores/playback-store'
import { useProjectStore } from '../../../stores/project-store'
import { audioEngine } from '../../../audio/engine'
import { PlaybackControls } from '../../../components/studio/PlaybackControls'
import { formatTime } from '../../../lib/utils'

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  onChangeVideo: () => void
  isChangingVideo?: boolean
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoRef,
  onChangeVideo,
  isChangingVideo = false,
}) => {
  const {
    videos,
    selectedVideoId,
    activeVideoObjectUrl,
    isPlaying,
    currentTime,
    isMuted,
    setPlaybackState,
  } = useVideoStore()
  const { isPlaying: isAudioPlaying, setIsPlaying, setCurrentTime } = usePlaybackStore()
  const currentProject = useProjectStore((state) => state.currentProject)

  const activeVideo = videos.find((v) => v.id === selectedVideoId)

  const togglePlay = async () => {
    if (!videoRef.current || !currentProject) return
    const nextPlaying = !isPlaying && !isAudioPlaying

    if (nextPlaying) {
      setPlaybackState({ isPlaying: true })
      setIsPlaying(true)
      videoRef.current.currentTime = currentTime
      videoRef.current.play().catch(() => {})
      await audioEngine.play(currentProject, currentTime)
    } else {
      const pausedAt = audioEngine.pause()
      setPlaybackState({ isPlaying: false })
      setIsPlaying(false)
      videoRef.current.pause()
      setCurrentTime(pausedAt)
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const time = videoRef.current.currentTime
    setPlaybackState({ currentTime: time })
    setCurrentTime(time)
  }

  const handleVideoEnded = () => {
    setPlaybackState({ isPlaying: false })
    setIsPlaying(false)
    audioEngine.stop()
  }

  if (!activeVideo || !activeVideoObjectUrl) {
    return null
  }

  return (
    <div className="flex flex-col w-full">
      {/* Project / Video Context Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
        {/* Left: video name and details */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Film className="w-4 h-4 text-sky-600 flex-shrink-0" />
          <div className="min-w-0">
            <p
              className="font-medium text-xs text-slate-800 truncate max-w-sm"
              title={activeVideo.name}
            >
              {activeVideo.name}
            </p>
            <p className="mt-0.5 text-[10px] font-mono text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
              {formatTime(activeVideo.durationSec)} • {activeVideo.metadata.width}×
              {activeVideo.metadata.height} {activeVideo.metadata.frameRate || 30} fps{' '}
              {(activeVideo.sizeBytes / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        </div>

        {/* Right: status and change action */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeVideo.transcriptionStatus === 'completed' && (
            <span className="hidden sm:flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
              <FileText className="h-3 w-3" />
              Transcript ready
            </span>
          )}
          <button
            type="button"
            onClick={onChangeVideo}
            disabled={isChangingVideo}
            className="btn btn-secondary text-[11px] py-1.5 px-2.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            title="Choose a different video file"
          >
            {isChangingVideo ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            <span>{isChangingVideo ? 'Importing' : 'Change video'}</span>
          </button>
        </div>
      </div>

      {/* Video Canvas Container (Hero) */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center group overflow-hidden">
        <video
          ref={videoRef}
          src={activeVideoObjectUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onClick={togglePlay}
          muted={isMuted}
          playsInline
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Centered Play/Pause Overlay */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-105 transition-all shadow-lg bg-slate-900/80 text-white backdrop-blur-xs border border-white/10"
        >
          {isPlaying || isAudioPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>
      </div>

      {/* Cohesive Playback Controls Toolbar */}
      <PlaybackControls
        videoRef={videoRef}
        durationSec={activeVideo?.durationSec || currentProject?.durationSec || 60}
      />
    </div>
  )
}
