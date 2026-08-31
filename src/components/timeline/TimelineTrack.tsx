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
          bg: 'rgba(168, 85, 247, 0.25)',
          border: 'var(--track-voice)',
          text: 'var(--foreground)',
        }
      case 'music':
        return {
          bg: 'rgba(6, 182, 212, 0.22)',
          border: 'var(--track-music)',
          text: 'var(--foreground)',
        }
      default:
        return {
          bg: 'rgba(56, 189, 248, 0.2)',
          border: 'var(--track-video)',
          text: 'var(--foreground)',
        }
    }
  }

  const colors = getTrackColor(track.type)

  return (
    <div
      className="relative h-12 w-full select-none"
      style={{
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {track.clips.length === 0 ? (
        <div className="h-full flex items-center px-3 text-[11px] font-mono italic" style={{ color: 'var(--muted-foreground)' }}>
          No audio clips
        </div>
      ) : (
        track.clips.map((clip) => {
          const clipLeft = clip.startSec * zoom
          const clipWidth = Math.max(36, clip.durationSec * zoom)
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
              className={`absolute top-1 bottom-1 rounded px-2 py-0.5 flex flex-col justify-between cursor-grab transition-all ${
                draggingClipId === clip.id ? 'cursor-grabbing opacity-90' : ''
              }`}
              style={{
                left: `${clipLeft}px`,
                width: `${clipWidth}px`,
                backgroundColor: colors.bg,
                border: `1px solid ${isSelected ? 'var(--foreground)' : colors.border}`,
                boxShadow: isSelected ? '0 0 0 1px var(--foreground)' : 'none',
              }}
            >
              {/* Top Row: Clip name and remove button */}
              <div className="flex items-center justify-between overflow-hidden gap-1">
                <span className="text-[10px] font-medium font-mono truncate" style={{ color: colors.text }}>
                  {clip.name}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeClip(clip.id)
                  }}
                  className="text-slate-400 hover:text-red-400 p-0.5 rounded transition-colors"
                  title="Remove clip"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Simulated Waveform Line / Visual */}
              <div className="flex items-center gap-[2px] h-3 overflow-hidden opacity-60 pointer-events-none">
                {Array.from({ length: Math.min(48, Math.floor(clipWidth / 4)) }).map((_, i) => {
                  const barHeight = Math.sin(i * 0.5) * 35 + 50
                  return (
                    <div
                      key={i}
                      className="w-[2px] rounded-full"
                      style={{
                        height: `${barHeight}%`,
                        backgroundColor: colors.border,
                      }}
                    />
                  )
                })}
              </div>

              {/* Bottom Row: Duration */}
              <div className="flex items-center justify-between text-[9px] font-mono opacity-80" style={{ color: colors.text }}>
                <span>{formatTime(clip.startSec)}</span>
                <span>{formatTime(clip.durationSec)}</span>
              </div>

              {/* Right Trim Handle */}
              <div
                onMouseDown={(e) => handleTrimRightMouseDown(e, clip)}
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r transition-colors"
                title="Drag to trim duration"
              />
            </div>
          )
        })
      )}
    </div>
  )
}
