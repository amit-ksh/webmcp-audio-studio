import React from 'react'
import { ArrowLeft, Play, Pause } from 'lucide-react'
import { useVideoStore } from '../../../stores/video-store'
import { usePlaybackStore } from '../../../stores/playback-store'
import { useProjectStore } from '../../../stores/project-store'
import { audioEngine } from '../../../audio/engine'

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  onNewVideo: () => void
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ videoRef, onNewVideo }) => {
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
    <div className="flex flex-col gap-2 w-full">
      {/* Top Bar: New video action & metadata */}
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onNewVideo}
          className="btn btn-ghost text-xs py-1 px-2 -ml-2 text-slate-400 hover:text-white flex items-center gap-1.5"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>New video</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
          <span>{activeVideo.metadata.width}×{activeVideo.metadata.height}</span>
          <span>•</span>
          <span>{activeVideo.metadata.frameRate || 30} fps</span>
          <span>•</span>
          <span className="truncate max-w-[140px]">{activeVideo.name}</span>
        </div>
      </div>

      {/* Video Viewport Container */}
      <div
        className="relative aspect-video w-full bg-black rounded-md overflow-hidden flex items-center justify-center group shadow-md"
        style={{ border: '1px solid var(--border)' }}
      >
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

        {/* Center Play/Pause button on hover */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-90 hover:scale-105 transition-all shadow-md"
          style={{
            backgroundColor: 'rgba(11, 13, 17, 0.75)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        >
          {isPlaying || isAudioPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>
      </div>
    </div>
  )
}
