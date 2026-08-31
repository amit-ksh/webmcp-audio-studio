import React, { useEffect, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, RotateCw } from 'lucide-react'
import { usePlaybackStore } from '../../stores/playback-store'
import { useProjectStore } from '../../stores/project-store'
import { useVideoStore } from '../../stores/video-store'
import { audioEngine } from '../../audio/engine'
import { formatTime } from '../../lib/utils'

interface PlaybackControlsProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>
  durationSec?: number
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ videoRef, durationSec = 60 }) => {
  const {
    isPlaying,
    currentTime,
    masterVolume,
    setIsPlaying,
    setCurrentTime,
    setMasterVolume,
  } = usePlaybackStore()
  const currentProject = useProjectStore((state) => state.currentProject)
  const isMuted = useVideoStore((state) => state.isMuted)
  const setVideoPlaybackState = useVideoStore((state) => state.setPlaybackState)

  const isSeekingRef = useRef(false)

  useEffect(() => {
    audioEngine.setTimeUpdateListener((time) => {
      if (!isSeekingRef.current) {
        setCurrentTime(time)
        setVideoPlaybackState({ currentTime: time })
        if (videoRef?.current && Math.abs(videoRef.current.currentTime - time) > 0.25) {
          videoRef.current.currentTime = time
        }
      }
    })

    audioEngine.setEndedListener(() => {
      setIsPlaying(false)
      setVideoPlaybackState({ isPlaying: false })
      if (videoRef?.current) {
        videoRef.current.pause()
      }
    })
  }, [setCurrentTime, setIsPlaying, setVideoPlaybackState, videoRef])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        handleTogglePlay()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, currentProject, currentTime])

  const handleTogglePlay = async () => {
    if (!currentProject) return

    if (isPlaying) {
      const pausedAt = audioEngine.pause()
      setIsPlaying(false)
      setVideoPlaybackState({ isPlaying: false })
      if (videoRef?.current) {
        videoRef.current.pause()
      }
      setCurrentTime(pausedAt)
    } else {
      setIsPlaying(true)
      setVideoPlaybackState({ isPlaying: true })
      if (videoRef?.current) {
        videoRef.current.currentTime = currentTime
        videoRef.current.play().catch(() => {})
      }
      await audioEngine.play(currentProject, currentTime)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSec = parseFloat(e.target.value)
    setCurrentTime(targetSec)
    setVideoPlaybackState({ currentTime: targetSec })

    if (videoRef?.current) {
      videoRef.current.currentTime = targetSec
    }
    if (currentProject) {
      audioEngine.seek(targetSec, currentProject)
    }
  }

  const handleSkip = (deltaSec: number) => {
    const targetSec = Math.max(0, Math.min(maxDuration, currentTime + deltaSec))
    setCurrentTime(targetSec)
    setVideoPlaybackState({ currentTime: targetSec })
    if (videoRef?.current) {
      videoRef.current.currentTime = targetSec
    }
    if (currentProject) {
      audioEngine.seek(targetSec, currentProject)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setMasterVolume(vol)
    audioEngine.setMasterGain(vol)
    setVideoPlaybackState({ volume: vol, isMuted: vol === 0 })
    if (videoRef?.current) {
      videoRef.current.volume = vol
      videoRef.current.muted = vol === 0
    }
  }

  const toggleMute = () => {
    const nextMuted = !isMuted
    const targetVol = nextMuted ? 0 : masterVolume || 1.0
    setVideoPlaybackState({ isMuted: nextMuted })
    audioEngine.setMasterGain(targetVol)
    if (videoRef?.current) {
      videoRef.current.muted = nextMuted
    }
  }

  const handleFullscreen = () => {
    if (videoRef?.current?.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

  const maxDuration = Math.max(durationSec, currentProject?.durationSec || 1, 1)

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 bg-slate-50/80 border-t border-slate-200 select-none">
      {/* Left: Transport controls (Skip, Play/Pause, Forward) */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleSkip(-5)}
          className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          title="Rewind 5s"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleTogglePlay}
          className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 mx-0.5"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSkip(5)}
          className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          title="Forward 5s"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: Time & Scrubber */}
      <div className="flex-1 flex items-center gap-2.5 mx-2">
        <div className="text-[11px] font-mono font-medium text-slate-600 flex items-center gap-1 whitespace-nowrap">
          <span className="text-slate-900 font-semibold">{formatTime(currentTime)}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">{formatTime(maxDuration)}</span>
        </div>

        <input
          type="range"
          min={0}
          max={maxDuration}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 cursor-pointer"
          title={`Seek: ${formatTime(currentTime)}`}
        />
      </div>

      {/* Right: Aspect ratio, Volume, Fullscreen */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
          16:9
        </span>

        <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200">
          <button
            type="button"
            onClick={toggleMute}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || masterVolume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-red-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={1.2}
            step="0.05"
            value={isMuted ? 0 : masterVolume}
            onChange={handleVolumeChange}
            className="w-14 cursor-pointer"
            title={`Volume: ${Math.round((isMuted ? 0 : masterVolume) * 100)}%`}
          />
        </div>

        <button
          type="button"
          onClick={handleFullscreen}
          className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
