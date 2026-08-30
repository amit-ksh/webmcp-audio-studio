import React, { useRef, useState } from 'react'
import { Mic, Music, Volume2, Trash2, Radio } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { usePlaybackStore } from '../../stores/playback-store'
import { audioEngine } from '../../audio/engine'
import { formatTime, formatDb } from '../../lib/utils'
import type { Clip, TrackType } from '../../contracts/project'

export const Timeline: React.FC = () => {
  const {
    currentProject,
    setTrackGain,
    toggleTrackMute,
    toggleTrackSolo,
    addTrack,
    removeTrack,
    updateClip,
    removeClip,
    selectClip,
    selectedClipId,
  } = useProjectStore()
  const { currentTime, zoom, setCurrentTime } = usePlaybackStore()
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null)
  const [clipInitialStart, setClipInitialStart] = useState(0)

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        No project loaded.
      </div>
    )
  }

  const durationSec = Math.max(currentProject.durationSec, 60)
  const totalWidthPx = durationSec * zoom

  // Timeline scrub / seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingClipId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left + e.currentTarget.scrollLeft
    const targetSec = Math.max(0, clickX / zoom)
    setCurrentTime(targetSec)
    audioEngine.seek(targetSec, currentProject)
  }

  // Clip drag repositioning
  const handleClipMouseDown = (e: React.MouseEvent, clip: Clip) => {
    e.stopPropagation()
    selectClip(clip.id)
    setDraggingClipId(clip.id)
    setClipInitialStart(clip.startSec)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - e.clientX
      const deltaSec = deltaX / zoom
      const newStart = Math.max(0, clipInitialStart + deltaSec)
      updateClip(clip.id, { startSec: parseFloat(newStart.toFixed(2)) })
    }

    const handleMouseUp = () => {
      setDraggingClipId(null)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Right trim handle drag
  const handleTrimRightMouseDown = (e: React.MouseEvent, clip: Clip) => {
    e.stopPropagation()
    const initialDuration = clip.durationSec

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - e.clientX
      const deltaSec = deltaX / zoom
      const newDuration = Math.max(0.5, initialDuration + deltaSec)
      updateClip(clip.id, { durationSec: parseFloat(newDuration.toFixed(2)) })
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const getTrackIcon = (type: TrackType) => {
    switch (type) {
      case 'voiceover':
        return <Mic className="w-4 h-4 text-violet-400" />
      case 'music':
        return <Music className="w-4 h-4 text-cyan-400" />
      default:
        return <Volume2 className="w-4 h-4 text-amber-400" />
    }
  }

  const getClipColor = (trackType: TrackType) => {
    switch (trackType) {
      case 'voiceover':
        return 'from-violet-950/90 to-purple-900/90 border-violet-500/70 text-violet-200 shadow-violet-950/50'
      case 'music':
        return 'from-cyan-950/90 to-teal-900/90 border-cyan-500/70 text-cyan-200 shadow-cyan-950/50'
      default:
        return 'from-amber-950/90 to-orange-900/90 border-amber-500/70 text-amber-200 shadow-amber-950/50'
    }
  }

  // Collect speech intervals for visual ducking zones
  const voiceClips: { start: number; end: number }[] = []
  for (const t of currentProject.tracks) {
    if (t.type === 'voiceover' && !t.muted) {
      for (const c of t.clips) {
        voiceClips.push({ start: c.startSec, end: c.startSec + c.durationSec })
      }
    }
  }

  // Generate ruler tick marks
  const rulerIntervalSec = zoom < 30 ? 5 : zoom < 80 ? 2 : 1
  const ticks: number[] = []
  for (let s = 0; s <= durationSec; s += rulerIntervalSec) {
    ticks.push(s)
  }

  return (
    <div className="flex-1 flex flex-col bg-[#070a11] overflow-hidden select-none border-t border-slate-800">
      {/* Timeline Scroll Area */}
      <div ref={timelineRef} className="flex-1 flex flex-col overflow-auto relative">
        {/* Time Ruler */}
        <div
          onClick={handleTimelineClick}
          className="h-7 bg-slate-950 border-b border-slate-800 flex items-end sticky top-0 z-30 cursor-pointer shadow-sm"
          style={{ minWidth: `${totalWidthPx + 220}px` }}
        >
          {/* Header spacer for track controls */}
          <div className="w-56 bg-slate-900 h-full border-r border-slate-800 flex items-center justify-between px-3 sticky left-0 z-40">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Tracks ({currentProject.tracks.length})
            </span>
            {currentProject.ducking?.enabled && (
              <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 px-1 py-0.5 rounded border border-amber-500/30">
                DUCK {currentProject.ducking.duckingAmountDb}dB
              </span>
            )}
          </div>

          {/* Time Ruler Ticks */}
          <div className="relative flex-1 h-full">
            {ticks.map((sec) => (
              <div
                key={sec}
                className="absolute top-0 bottom-0 flex flex-col justify-end"
                style={{ left: `${sec * zoom}px` }}
              >
                <span className="text-[9px] font-mono text-slate-500 pl-1 pb-0.5">
                  {formatTime(sec).slice(0, 5)}
                </span>
                <div className="w-[1px] h-2 bg-slate-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Playhead Indicator Line */}
        <div
          className="absolute top-0 bottom-0 z-30 pointer-events-none transition-none"
          style={{ left: `${224 + currentTime * zoom}px` }}
        >
          {/* Playhead Marker */}
          <div className="w-3 h-3 bg-red-500 rotate-45 -ml-1.5 -mt-1.5 shadow-md shadow-red-500/50" />
          <div className="w-[1.5px] h-full bg-red-500 shadow-sm" />
        </div>

        {/* Track Lanes */}
        <div className="flex flex-col" style={{ minWidth: `${totalWidthPx + 220}px` }}>
          {currentProject.tracks.map((track) => (
            <div
              key={track.id}
              className="flex border-b border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/20 transition-colors h-24 group"
            >
              {/* Track Controls Sidebar */}
              <div className="w-56 bg-slate-900/95 border-r border-slate-800 p-2 flex flex-col justify-between sticky left-0 z-20 backdrop-blur shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {getTrackIcon(track.type)}
                    <span className="text-xs font-semibold text-slate-200 truncate" title={track.name}>
                      {track.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeTrack(track.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-opacity"
                    title="Delete Track"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Track Gain, Mute, Solo */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={track.gain}
                      onChange={(e) => setTrackGain(track.id, parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 h-1 cursor-pointer"
                      title={`Track Gain: ${formatDb(track.gain)}`}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 w-9 text-right">
                    {formatDb(track.gain)}
                  </span>
                  <button
                    onClick={() => toggleTrackMute(track.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                      track.muted
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                    title={track.muted ? 'Unmute Track' : 'Mute Track'}
                  >
                    M
                  </button>
                  <button
                    onClick={() => toggleTrackSolo(track.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                      track.solo
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                    title={track.solo ? 'Unsolo Track' : 'Solo Track'}
                  >
                    S
                  </button>
                </div>
              </div>

              {/* Clip Area */}
              <div
                onClick={handleTimelineClick}
                className="flex-1 relative h-full bg-slate-950/20 cursor-pointer overflow-hidden"
              >
                {/* Background grid lines */}
                {ticks.map((sec) => (
                  <div
                    key={sec}
                    className="absolute top-0 bottom-0 w-[1px] bg-slate-900/40 pointer-events-none"
                    style={{ left: `${sec * zoom}px` }}
                  />
                ))}

                {/* Shaded Sidechain Ducking Visualizer on Music Tracks */}
                {track.type === 'music' &&
                  currentProject.ducking?.enabled &&
                  voiceClips.map((vc, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 bg-amber-500/10 border-l border-r border-amber-500/20 pointer-events-none z-0"
                      style={{
                        left: `${vc.start * zoom}px`,
                        width: `${Math.max(10, (vc.end - vc.start) * zoom)}px`,
                      }}
                    >
                      <span className="text-[8px] font-mono text-amber-400/70 p-1 block">
                        Ducked ({currentProject.ducking.duckingAmountDb}dB)
                      </span>
                    </div>
                  ))}

                {/* Clips */}
                {track.clips.map((clip) => {
                  const clipLeft = clip.startSec * zoom
                  const clipWidth = Math.max(30, clip.durationSec * zoom)
                  const isSelected = selectedClipId === clip.id

                  return (
                    <div
                      key={clip.id}
                      onMouseDown={(e) => handleClipMouseDown(e, clip)}
                      onClick={(e) => {
                        e.stopPropagation()
                        selectClip(clip.id)
                      }}
                      className={`absolute top-2 bottom-2 rounded-md border bg-gradient-to-r ${getClipColor(
                        track.type,
                      )} p-2 flex flex-col justify-between cursor-move shadow-md select-none transition-all ${
                        isSelected
                          ? 'ring-2 ring-indigo-400 border-indigo-400 z-10'
                          : 'hover:brightness-110'
                      }`}
                      style={{
                        left: `${clipLeft}px`,
                        width: `${clipWidth}px`,
                      }}
                    >
                      <div className="flex items-center justify-between pointer-events-none">
                        <span className="text-[11px] font-bold font-mono truncate drop-shadow">
                          {clip.name}
                        </span>
                        <div className="flex items-center gap-1 pointer-events-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeClip(clip.id)
                            }}
                            className="p-0.5 rounded hover:bg-rose-500 hover:text-white text-slate-400 transition-colors"
                            title="Remove clip"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* Simulated Audio Waveform Bars */}
                      <div className="flex items-center gap-[2px] h-5 overflow-hidden opacity-65 pointer-events-none">
                        {Array.from({ length: Math.min(60, Math.floor(clipWidth / 4)) }).map(
                          (_, i) => {
                            const barHeight = Math.sin(i * 0.4) * 40 + 50
                            return (
                              <div
                                key={i}
                                className="w-[2px] bg-current rounded-full"
                                style={{ height: `${barHeight}%` }}
                              />
                            )
                          },
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-300/80 pointer-events-none">
                        <span>{formatTime(clip.startSec)}</span>
                        <span>{formatTime(clip.durationSec)}</span>
                      </div>

                      {/* Right Trim Handle */}
                      <div
                        onMouseDown={(e) => handleTrimRightMouseDown(e, clip)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r-md transition-colors"
                        title="Drag to trim duration"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Add Track Toolbar */}
        <div className="p-3 flex items-center gap-2 bg-slate-950 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Add Track:</span>
          <button
            onClick={() => addTrack('voiceover')}
            className="btn btn-secondary text-xs py-1 px-2.5 text-violet-300 hover:text-white"
          >
            <Mic className="w-3.5 h-3.5 text-violet-400" /> Voiceover
          </button>
          <button
            onClick={() => addTrack('music')}
            className="btn btn-secondary text-xs py-1 px-2.5 text-cyan-300 hover:text-white"
          >
            <Music className="w-3.5 h-3.5 text-cyan-400" /> Music
          </button>
          <button
            onClick={() => addTrack('sfx')}
            className="btn btn-secondary text-xs py-1 px-2.5 text-amber-300 hover:text-white"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" /> Sound FX
          </button>
        </div>
      </div>
    </div>
  )
}
