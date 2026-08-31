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
    <div className="flex flex-col w-full border-t border-slate-200 bg-white">
      {/* Timeline Section Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-200">
        {/* Left Title */}
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800">
            Timeline
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            ({currentProject.tracks.length} tracks)
          </span>
        </div>

        {/* Center Current Time Pill */}
        <div className="px-3 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          {formatTime(currentTime)}
        </div>

        {/* Right Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom(zoom - 10)}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
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
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Track Editor Area */}
      <div className="flex w-full overflow-hidden bg-slate-50/30">
        {/* Left Track Column Headers */}
        <div className="w-32 flex flex-col flex-shrink-0 select-none z-10 bg-white border-r border-slate-200 shadow-2xs">
          {/* Header Spacer for Time Ruler */}
          <div className="h-7 flex items-center px-3 text-[10px] font-mono font-bold uppercase text-slate-400 border-b border-slate-200 bg-slate-50/60">
            Tracks
          </div>

          {/* Track 1: Video */}
          <div className="h-10 flex items-center px-3 gap-2 border-b border-slate-100">
            <Video className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-xs font-semibold text-sky-950">Video</span>
          </div>

          {/* Track 2: Voiceover */}
          <div className="h-14 flex items-center px-3 gap-2 border-b border-slate-100">
            <Mic className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs font-semibold text-purple-950">Voice</span>
          </div>

          {/* Track 3: Music */}
          <div className="h-14 flex items-center px-3 gap-2">
            <Music className="w-3.5 h-3.5 text-cyan-600" />
            <span className="text-xs font-semibold text-cyan-950">Music</span>
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
            <div className="h-7 flex items-end relative bg-slate-50/60 border-b border-slate-200">
              {ticks.map((sec) => (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 flex flex-col justify-end pointer-events-none"
                  style={{ left: `${sec * zoom}px` }}
                >
                  <span className="text-[9px] font-mono text-slate-400 pl-1 pb-0.5 leading-none">
                    {formatTime(sec).slice(0, 5)}
                  </span>
                  <div className="w-[1px] h-2 bg-slate-300" />
                </div>
              ))}
            </div>

            {/* Playhead Indicator */}
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none transition-none"
              style={{ left: `${currentTime * zoom}px` }}
            >
              {/* Playhead Pin */}
              <div className="w-2.5 h-2.5 rotate-45 -ml-[4px] -mt-[3px] bg-blue-600 shadow-xs rounded-xs" />
              <div className="w-[1.5px] h-full bg-blue-600 shadow-xs" />
            </div>

            {/* Lane 1: Video Track Bar */}
            <div className="relative h-10 flex items-center px-2 border-b border-slate-100">
              <div
                className="h-6 rounded-md flex items-center px-2.5 text-[10px] font-mono font-semibold bg-sky-50 border border-sky-300 text-sky-700 shadow-2xs"
                style={{ width: `${videoDuration * zoom}px` }}
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
                      className="absolute top-0 bottom-0 pointer-events-none z-10 bg-amber-100/50 border-l border-r border-dashed border-amber-300/80"
                      style={{
                        left: `${vc.start * zoom}px`,
                        width: `${Math.max(10, (vc.end - vc.start) * zoom)}px`,
                      }}
                    >
                      <span className="text-[8px] font-mono text-amber-700 font-semibold p-1 block">
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
