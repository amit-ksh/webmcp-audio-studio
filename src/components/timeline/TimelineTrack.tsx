import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { formatTime } from '../../lib/utils'
import type { Track, Clip, TrackType } from '../../contracts/project'

interface TimelineTrackProps {
  track: Track
  zoom: number
  totalDurationSec: number
  onClipClick?: (clip: Clip) => void
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  track,
  zoom,
  totalDurationSec,
  onClipClick,
}) => {
  const { updateClip, removeClip, selectClip, selectedClipId } = useProjectStore()
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null)
  const [clipInitialStart, setClipInitialStart] = useState(0)

  const handleClipMouseDown = (e: React.MouseEvent, clip: Clip) => {
    e.stopPropagation()
    selectClip(clip.id)
    setDraggingClipId(clip.id)
    setClipInitialStart(clip.startSec)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - e.clientX
      const deltaSec = deltaX / zoom
      const newStart = Math.max(0, Math.min(totalDurationSec - 0.5, clipInitialStart + deltaSec))
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

  const getTrackColor = (type: TrackType) => {
    switch (type) {
      case 'voiceover':
        return {
          bg: 'rgba(168, 85, 247, 0.18)',
          border: 'rgba(168, 85, 247, 0.5)',
          activeBorder: '#a855f7',
          wave: '#c084fc',
          text: 'var(--foreground)',
        }
      case 'music':
        return {
          bg: 'rgba(6, 182, 212, 0.18)',
          border: 'rgba(6, 182, 212, 0.5)',
          activeBorder: '#06b6d4',
          wave: '#22d3ee',
          text: 'var(--foreground)',
        }
      default:
        return {
          bg: 'rgba(56, 189, 248, 0.18)',
          border: 'rgba(56, 189, 248, 0.5)',
          activeBorder: '#38bdf8',
          wave: '#38bdf8',
          text: 'var(--foreground)',
        }
    }
  }

  const colors = getTrackColor(track.type)

  return (
    <div
      className="relative h-14 w-full select-none"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {track.clips.length === 0 ? (
        <div className="h-full flex items-center px-4 text-[11px] font-mono italic opacity-40">
          No clips on this track
        </div>
      ) : (
        track.clips.map((clip) => {
          const clipLeft = clip.startSec * zoom
          const clipWidth = Math.max(48, clip.durationSec * zoom)
          const isSelected = selectedClipId === clip.id

          return (
            <div
              key={clip.id}
              onMouseDown={(e) => handleClipMouseDown(e, clip)}
              onClick={(e) => {
                e.stopPropagation()
                selectClip(clip.id)
                onClipClick?.(clip)
              }}
              className={`absolute top-1.5 bottom-1.5 rounded-lg px-2.5 py-1 flex flex-col justify-between cursor-grab transition-all shadow-sm ${
                draggingClipId === clip.id ? 'cursor-grabbing opacity-90 scale-[1.01]' : ''
              }`}
              style={{
                left: `${clipLeft}px`,
                width: `${clipWidth}px`,
                backgroundColor: colors.bg,
                border: `1.5px solid ${isSelected ? colors.activeBorder : colors.border}`,
                boxShadow: isSelected ? `0 0 10px ${colors.bg}` : 'none',
              }}
            >
              {/* Top: Name & Remove */}
              <div className="flex items-center justify-between gap-1 overflow-hidden pointer-events-none">
                <span className="text-[10px] font-semibold font-mono truncate" style={{ color: colors.text }}>
                  {clip.name}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeClip(clip.id)
                  }}
                  className="text-slate-400 hover:text-red-400 p-0.5 rounded transition-colors pointer-events-auto"
                  title="Remove clip"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Waveform Visualization */}
              <div className="flex items-center gap-[2px] h-3.5 overflow-hidden opacity-75 pointer-events-none">
                {Array.from({ length: Math.min(60, Math.floor(clipWidth / 4)) }).map((_, i) => {
                  const barHeight = Math.sin(i * 0.45) * 35 + 50
                  return (
                    <div
                      key={i}
                      className="w-[2px] rounded-full"
                      style={{
                        height: `${barHeight}%`,
                        backgroundColor: colors.wave,
                      }}
                    />
                  )
                })}
              </div>

              {/* Bottom: Timestamps */}
              <div className="flex items-center justify-between text-[9px] font-mono opacity-80 pointer-events-none">
                <span>{formatTime(clip.startSec)}</span>
                <span>{formatTime(clip.durationSec)}</span>
              </div>

              {/* Right Trim Handle */}
              <div
                onMouseDown={(e) => handleTrimRightMouseDown(e, clip)}
                className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/30 rounded-r-lg transition-colors"
                title="Drag to trim duration"
              />
            </div>
          )
        })
      )}
    </div>
  )
}
