import React, { useRef } from 'react'
import { useProjectStore } from '../../stores/project-store'
import { usePlaybackStore } from '../../stores/playback-store'
import { useVideoStore } from '../../stores/video-store'
import { audioEngine } from '../../audio/engine'
import { formatTime } from '../../lib/utils'
import { TimelineTrack } from './TimelineTrack'

export const Timeline: React.FC = () => {
  const currentProject = useProjectStore((state) => state.currentProject)
  const { currentTime, zoom, setCurrentTime } = usePlaybackStore()
  const { videos, selectedVideoId, setPlaybackState } = useVideoStore()
  const timelineRef = useRef<HTMLDivElement | null>(null)

  if (!currentProject) return null

  const activeVideo = videos.find((v) => v.id === selectedVideoId)
  const videoDuration = activeVideo?.durationSec || currentProject.durationSec || 60
  const totalDuration = Math.max(videoDuration, currentProject.durationSec, 30)
  const totalWidthPx = Math.max(760, totalDuration * zoom)

  const voiceTrack = currentProject.tracks.find((t) => t.type === 'voiceover')
  const musicTrack = currentProject.tracks.find((t) => t.type === 'music')

  // Collect speech intervals for visual ducking zones
  const voiceClips: { start: number; end: number }[] = []
  if (voiceTrack && !voiceTrack.muted) {
    for (const c of voiceTrack.clips) {
      voiceClips.push({ start: c.startSec, end: c.startSec + c.durationSec })
    }
  }

  // Generate ruler tick marks
  const rulerIntervalSec = zoom < 30 ? 15 : zoom < 60 ? 10 : 5
  const ticks: number[] = []
  for (let s = 0; s <= totalDuration; s += rulerIntervalSec) {
    ticks.push(s)
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left + e.currentTarget.scrollLeft
    const targetSec = Math.max(0, Math.min(totalDuration, clickX / zoom))
    setCurrentTime(targetSec)
    setPlaybackState({ currentTime: targetSec })
    audioEngine.seek(targetSec, currentProject)
  }

  return (
    <div
      className="flex flex-col w-full rounded-md overflow-hidden"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Scrollable Timeline Area */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="w-full overflow-x-auto relative cursor-pointer select-none"
      >
        <div style={{ width: `${totalWidthPx}px`, minWidth: '100%' }}>
          {/* Time Ruler */}
          <div
            className="h-6 flex items-end relative"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {ticks.map((sec) => (
              <div
                key={sec}
                className="absolute top-0 bottom-0 flex flex-col justify-end pointer-events-none"
                style={{ left: `${sec * zoom}px` }}
              >
                <span
                  className="text-[9px] font-mono pl-1 pb-0.5 leading-none"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {formatTime(sec).slice(0, 5)}
                </span>
                <div className="w-[1px] h-1.5" style={{ backgroundColor: 'var(--border)' }} />
              </div>
            ))}
          </div>

          {/* Playhead Vertical Line */}
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none transition-none"
            style={{ left: `${currentTime * zoom}px` }}
          >
            <div
              className="w-2.5 h-2.5 rotate-45 -ml-[4px] -mt-[3px] shadow-sm"
              style={{ backgroundColor: 'var(--accent)' }}
            />
            <div className="w-[1.5px] h-full" style={{ backgroundColor: 'var(--accent)' }} />
          </div>

          {/* Track 1: VIDEO Track */}
          <div
            className="relative h-8 flex items-center px-2"
            style={{
              backgroundColor: 'var(--surface)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="h-5 rounded flex items-center px-2 text-[10px] font-mono font-semibold"
              style={{
                width: `${videoDuration * zoom}px`,
                backgroundColor: 'rgba(56, 189, 248, 0.18)',
                border: '1px solid var(--track-video)',
                color: 'var(--track-video)',
              }}
            >
              <span className="truncate">VIDEO • {formatTime(videoDuration)}</span>
            </div>
          </div>

          {/* Track 2: VOICE Track */}
          {voiceTrack && (
            <TimelineTrack
              track={voiceTrack}
              zoom={zoom}
              totalDurationSec={totalDuration}
            />
          )}

          {/* Track 3: BGM Track */}
          {musicTrack && (
            <div className="relative">
              {/* Shaded ducking indicators */}
              {currentProject.ducking?.enabled &&
                voiceClips.map((vc, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 pointer-events-none z-10"
                    style={{
                      left: `${vc.start * zoom}px`,
                      width: `${Math.max(8, (vc.end - vc.start) * zoom)}px`,
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      borderLeft: '1px dashed rgba(245, 158, 11, 0.35)',
                      borderRight: '1px dashed rgba(245, 158, 11, 0.35)',
                    }}
                  />
                ))}
              <TimelineTrack
                track={musicTrack}
                zoom={zoom}
                totalDurationSec={totalDuration}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
