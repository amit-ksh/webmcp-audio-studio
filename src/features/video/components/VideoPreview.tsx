import React from 'react'
import { ArrowLeft, Play, Pause, Film } from 'lucide-react'
import { useVideoStore } from '../../../stores/video-store'
import { usePlaybackStore } from '../../../stores/playback-store'
import { useProjectStore } from '../../../stores/project-store'
import { audioEngine } from '../../../audio/engine'
import { PlaybackControls } from '../../../components/studio/PlaybackControls'

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
    <div className="studio-card p-4 flex flex-col gap-3 w-full">
      {/* Video Card Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewVideo}
            className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
            title="Change or upload a different video"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change video</span>
          </button>

          <div className="flex items-center gap-1.5 ml-1 text-xs font-semibold truncate max-w-xs" style={{ color: 'var(--foreground)' }}>
            <Film className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="truncate">{activeVideo.name}</span>
          </div>
        </div>

        {/* Video Specs Badges */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
          <span className="px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            {activeVideo.metadata.width}×{activeVideo.metadata.height}
          </span>
          <span className="px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            {activeVideo.metadata.frameRate || 30} fps
          </span>
        </div>
      </div>

      {/* Video Viewport Container */}
      <div
        className="relative aspect-video w-full bg-black rounded-xl overflow-hidden flex items-center justify-center group shadow-inner"
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

        {/* Center Hover Play/Pause Overlay */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-14 h-14 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-95 hover:scale-110 transition-all shadow-xl backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(13, 15, 20, 0.8)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        >
          {isPlaying || isAudioPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5 text-blue-400" />
          )}
        </button>
      </div>

      {/* Integrated Transport Controls Bar */}
      <PlaybackControls
        videoRef={videoRef}
        durationSec={activeVideo?.durationSec || currentProject?.durationSec || 60}
      />
    </div>
  )
}
