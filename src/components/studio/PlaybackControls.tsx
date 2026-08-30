import React, { useEffect } from 'react'
import { Play, Pause, Square, Volume2, ZoomIn, ZoomOut } from 'lucide-react'
import { usePlaybackStore } from '../../stores/playback-store'
import { useProjectStore } from '../../stores/project-store'
import { audioEngine } from '../../audio/engine'
import { formatTime, formatDb } from '../../lib/utils'
import { MasterMeter } from './MasterMeter'

export const PlaybackControls: React.FC = () => {
  const { isPlaying, currentTime, zoom, masterVolume, setIsPlaying, setCurrentTime, setZoom, setMasterVolume } =
    usePlaybackStore()
  const currentProject = useProjectStore((state) => state.currentProject)

  // Attach engine time listener
  useEffect(() => {
    audioEngine.setTimeUpdateListener((time) => {
      setCurrentTime(time)
    })
    audioEngine.setEndedListener(() => {
      setIsPlaying(false)
    })
  }, [setCurrentTime, setIsPlaying])

  // Spacebar toggle playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
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
      setCurrentTime(pausedAt)
    } else {
      setIsPlaying(true)
      await audioEngine.play(currentProject, currentTime)
    }
  }

  const handleStop = () => {
    audioEngine.stop()
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setMasterVolume(vol)
    audioEngine.setMasterGain(vol)
    if (currentProject) {
      useProjectStore.getState().setMasterGain(vol)
    }
  }

  return (
    <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg shadow-lg">
      {/* Transport buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleTogglePlay}
          className={`p-2 rounded-md transition-all ${
            isPlaying
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
          }`}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
        </button>

        <button
          onClick={handleStop}
          className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Stop (Rewind to 0:00)"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>

      {/* Time Display */}
      <div className="bg-slate-950 px-3 py-1 rounded border border-slate-800/80 font-mono text-sm tracking-wider font-semibold text-cyan-400 min-w-[76px] text-center shadow-inner">
        {formatTime(currentTime)}
      </div>

      {/* Master Meter */}
      <MasterMeter />

      {/* Master Volume */}
      <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
        <Volume2 className="w-4 h-4 text-slate-400" />
        <input
          type="range"
          min="0"
          max="1.2"
          step="0.01"
          value={masterVolume}
          onChange={handleVolumeChange}
          className="w-20 accent-indigo-500 cursor-pointer"
          title={`Master Volume: ${formatDb(masterVolume)}`}
        />
        <span className="text-[11px] font-mono text-slate-400 w-12 text-right">
          {formatDb(masterVolume)}
        </span>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
        <button
          onClick={() => setZoom(zoom - 15)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono text-slate-400 w-8 text-center">{zoom}px</span>
        <button
          onClick={() => setZoom(zoom + 15)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
