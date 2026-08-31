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
    <div
      className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Transport controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleSkip(-5)}
          className="btn btn-ghost text-xs p-1.5 rounded-lg"
          title="Rewind 5s"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleTogglePlay}
          className="btn btn-primary w-8 h-8 p-0 rounded-full flex items-center justify-center shadow-md"
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
          className="btn btn-ghost text-xs p-1.5 rounded-lg"
          title="Forward 5s"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Time Stamp Display */}
        <div
          className="px-2.5 py-1 rounded-md text-xs font-mono font-medium tracking-tight ml-1.5 flex items-center gap-1"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        >
          <span className="font-semibold text-blue-400">{formatTime(currentTime)}</span>
          <span style={{ color: 'var(--muted-foreground)' }}>/</span>
          <span style={{ color: 'var(--muted-foreground)' }}>{formatTime(maxDuration)}</span>
        </div>
      </div>

      {/* Scrubber slider */}
      <div className="flex-1 mx-2">
        <input
          type="range"
          min={0}
          max={maxDuration}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full cursor-pointer"
          title={`Seek: ${formatTime(currentTime)}`}
        />
      </div>

      {/* Right: Aspect ratio, Volume, Fullscreen */}
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-mono px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--muted-foreground)',
          }}
        >
          16:9
        </span>

        <div className="flex items-center gap-1.5 pl-1.5 border-l" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={toggleMute}
            className="btn btn-ghost text-xs p-1.5"
            style={{ color: 'var(--muted-foreground)' }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || masterVolume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={1.2}
            step="0.05"
            value={isMuted ? 0 : masterVolume}
            onChange={handleVolumeChange}
            className="w-16 cursor-pointer"
            title={`Volume: ${Math.round((isMuted ? 0 : masterVolume) * 100)}%`}
          />
        </div>

        <button
          type="button"
          onClick={handleFullscreen}
          className="btn btn-ghost text-xs p-1.5 ml-0.5"
          style={{ color: 'var(--muted-foreground)' }}
          title="Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
