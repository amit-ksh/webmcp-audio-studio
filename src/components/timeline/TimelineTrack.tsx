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

  const getTrackStyling = (type: TrackType) => {
    switch (type) {
      case 'voiceover':
        return {
          bg: '#faf5ff',
          border: '#d8b4fe',
          activeBorder: '#9333ea',
          wave: '#c084fc',
          text: '#581c87',
        }
      case 'music':
        return {
          bg: '#ecfeff',
          border: '#a5f3fc',
          activeBorder: '#0891b2',
          wave: '#22d3ee',
          text: '#164e63',
        }
      default:
        return {
          bg: '#f0f9ff',
          border: '#bae6fd',
          activeBorder: '#0284c7',
          wave: '#38bdf8',
          text: '#075985',
        }
    }
  }

  const style = getTrackStyling(track.type)

  return (
    <div className="relative h-12 w-full select-none border-b border-slate-100">
      {track.clips.length === 0 ? (
        <div className="h-full flex items-center px-4 text-[11px] font-mono text-slate-400">
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
              className={`absolute top-1 bottom-1 rounded-md px-2 py-1 flex flex-col justify-between cursor-grab transition-all ${
                draggingClipId === clip.id ? 'cursor-grabbing opacity-90 shadow-md' : 'shadow-2xs'
              }`}
              style={{
                left: `${clipLeft}px`,
                width: `${clipWidth}px`,
                backgroundColor: style.bg,
                border: `1px solid ${isSelected ? style.activeBorder : style.border}`,
                outline: isSelected ? `2px solid ${style.activeBorder}` : 'none',
              }}
            >
              {/* Top: Name & Remove */}
              <div className="flex items-center justify-between gap-1 overflow-hidden pointer-events-none">
                <span className="text-[10px] font-semibold truncate" style={{ color: style.text }}>
                  {clip.name}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeClip(clip.id)
                  }}
                  className="text-slate-400 hover:text-red-500 p-0.5 rounded pointer-events-auto transition-colors"
                  title="Remove clip"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Waveform Visualization */}
              <div className="flex items-center gap-[2px] h-3 overflow-hidden opacity-75 pointer-events-none">
                {Array.from({ length: Math.min(60, Math.floor(clipWidth / 4)) }).map((_, i) => {
                  const barHeight = Math.sin(i * 0.45) * 35 + 50
                  return (
                    <div
                      key={i}
                      className="w-[2px] rounded-full"
                      style={{
                        height: `${barHeight}%`,
                        backgroundColor: style.wave,
                      }}
                    />
                  )
                })}
              </div>

              {/* Bottom: Timestamps */}
              <div className="flex items-center justify-between text-[8px] font-mono opacity-75 pointer-events-none" style={{ color: style.text }}>
                <span>{formatTime(clip.startSec)}</span>
                <span>{formatTime(clip.durationSec)}</span>
              </div>

              {/* Right Trim Handle */}
              <div
                onMouseDown={(e) => handleTrimRightMouseDown(e, clip)}
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-r-md transition-colors"
                title="Drag to trim duration"
              />
            </div>
          )
        })
      )}
    </div>
  )
}
