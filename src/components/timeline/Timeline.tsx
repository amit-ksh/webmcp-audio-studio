import React, { useRef } from 'react'
import { Sliders, Video, Mic, Music, ZoomIn, ZoomOut } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { usePlaybackStore } from '../../stores/playback-store'
import { useVideoStore } from '../../stores/video-store'
import { audioEngine } from '../../audio/engine'
import { formatTime } from '../../lib/utils'
import { TimelineTrack } from './TimelineTrack'

export const Timeline: React.FC = () => {
  const currentProject = useProjectStore((state) => state.currentProject)
  const { currentTime, zoom, setZoom, setCurrentTime } = usePlaybackStore()
  const { videos, selectedVideoId, setPlaybackState } = useVideoStore()
  const timelineRef = useRef<HTMLDivElement | null>(null)

  if (!currentProject) return null

  const activeVideo = videos.find((v) => v.id === selectedVideoId)
  const videoDuration = activeVideo?.durationSec || currentProject.durationSec || 60
  const totalDuration = Math.max(videoDuration, currentProject.durationSec, 30)
  const totalWidthPx = Math.max(720, totalDuration * zoom)

  const voiceTrack = currentProject.tracks.find((t) => t.type === 'voiceover')
  const musicTrack = currentProject.tracks.find((t) => t.type === 'music')

  // Collect speech intervals for visual ducking zones
  const voiceClips: { start: number; end: number }[] = []
  if (voiceTrack && !voiceTrack.muted) {
    for (const c of voiceTrack.clips) {
      voiceClips.push({ start: c.startSec, end: c.startSec + c.durationSec })
    }
  }

  // Ruler tick intervals
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
    <div className="studio-card p-4 flex flex-col gap-3 w-full">
      {/* Timeline Card Header */}
      <div className="flex items-center justify-between">
        {/* Left Title */}
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold tracking-tight uppercase font-mono" style={{ color: 'var(--foreground)' }}>
            Timeline
          </span>
        </div>

        {/* Center Current Time Pill (as seen in Image 2) */}
        <div
          className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            color: '#60a5fa',
          }}
        >
          {formatTime(currentTime)}
        </div>

        {/* Right Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom(zoom - 10)}
            className="btn btn-ghost text-xs p-1"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min={15}
            max={120}
            step={5}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-20 cursor-pointer"
            title={`Zoom: ${zoom}px/s`}
          />

          <button
            type="button"
            onClick={() => setZoom(zoom + 10)}
            className="btn btn-ghost text-xs p-1"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Track Editor Surface */}
      <div
        className="rounded-xl overflow-hidden flex"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Left Track Headers Column */}
        <div
          className="w-28 flex flex-col flex-shrink-0 select-none z-10"
          style={{
            backgroundColor: 'var(--surface)',
            borderRight: '1px solid var(--border)',
          }}
        >
          {/* Header Spacer for Ruler */}
          <div
            className="h-7 flex items-center px-3 text-[10px] font-mono font-bold uppercase"
            style={{
              borderBottom: '1px solid var(--border)',
              color: 'var(--muted-foreground)',
            }}
          >
            Tracks
          </div>

          {/* Track 1: Video */}
          <div
            className="h-10 flex items-center px-3 gap-2"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <Video className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-semibold text-sky-400">Video</span>
          </div>

          {/* Track 2: Voiceover */}
          <div
            className="h-14 flex items-center px-3 gap-2"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <Mic className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400">Voice</span>
          </div>

          {/* Track 3: Music */}
          <div className="h-14 flex items-center px-3 gap-2">
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-400">BGM</span>
          </div>
        </div>

        {/* Right Scrollable Timeline Lanes */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          className="flex-1 overflow-x-auto relative cursor-pointer select-none"
        >
          <div style={{ width: `${totalWidthPx}px`, minWidth: '100%' }}>
            {/* Time Ruler */}
            <div
              className="h-7 flex items-end relative"
              style={{
                backgroundColor: 'var(--surface)',
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
                  <div className="w-[1px] h-2" style={{ backgroundColor: 'var(--border)' }} />
                </div>
              ))}
            </div>

            {/* Playhead Vertical Line */}
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none transition-none"
              style={{ left: `${currentTime * zoom}px` }}
            >
              <div
                className="w-3 h-3 rotate-45 -ml-[5px] -mt-[4px] shadow-md"
                style={{ backgroundColor: '#3b82f6' }}
              />
              <div className="w-[2px] h-full shadow-sm" style={{ backgroundColor: '#3b82f6' }} />
            </div>

            {/* Lane 1: Video Track Bar */}
            <div
              className="relative h-10 flex items-center px-2"
              style={{
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="h-6 rounded-md flex items-center px-2.5 text-[10px] font-mono font-semibold"
                style={{
                  width: `${videoDuration * zoom}px`,
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: 'var(--track-video)',
                }}
              >
                <span className="truncate">VIDEO • {formatTime(videoDuration)}</span>
              </div>
            </div>

            {/* Lane 2: Voiceover Track */}
            {voiceTrack && (
              <TimelineTrack
                track={voiceTrack}
                zoom={zoom}
                totalDurationSec={totalDuration}
              />
            )}

            {/* Lane 3: Music Track */}
            {musicTrack && (
              <div className="relative">
                {/* Visual sidechain ducking highlights */}
                {currentProject.ducking?.enabled &&
                  voiceClips.map((vc, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 pointer-events-none z-10"
                      style={{
                        left: `${vc.start * zoom}px`,
                        width: `${Math.max(10, (vc.end - vc.start) * zoom)}px`,
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        borderLeft: '1px dashed rgba(245, 158, 11, 0.4)',
                        borderRight: '1px dashed rgba(245, 158, 11, 0.4)',
                      }}
                    >
                      <span className="text-[8px] font-mono p-1 block" style={{ color: 'var(--warning)' }}>
                        Ducked
                      </span>
                    </div>
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
    </div>
  )
}
