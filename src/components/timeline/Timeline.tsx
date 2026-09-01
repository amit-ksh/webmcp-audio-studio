import React, { useRef } from 'react'
import { Sliders, Video, Mic, Music, ZoomIn, ZoomOut, Film } from 'lucide-react'
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
      {/* Timeline Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 border-b border-slate-200">
        {/* Left: Section Title */}
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-700">
            Timeline
          </span>
        </div>

        {/* Center: Current Time Indicator */}
        <div className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-white border border-slate-200 text-blue-600 shadow-2xs">
          {formatTime(currentTime)}
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom(zoom - 10)}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>

          <input
            type="range"
            min={15}
            max={120}
            step={5}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-16 cursor-pointer"
            title={`Zoom: ${zoom}px/s`}
          />

          <button
            type="button"
            onClick={() => setZoom(zoom + 10)}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Track Editor Area */}
      <div className="flex w-full overflow-hidden bg-slate-50/20">
        {/* Left Track Column Headers */}
        <div className="w-28 flex flex-col flex-shrink-0 select-none z-10 bg-white border-r border-slate-200 shadow-2xs">
          {/* Header Spacer for Time Ruler */}
          <div className="h-6 flex items-center px-3 text-[9px] font-mono font-bold uppercase text-slate-400 border-b border-slate-200 bg-slate-50/70">
            Track
          </div>

          {/* Track 1: Video */}
          <div className="h-9 flex items-center px-3 gap-1.5 border-b border-slate-100">
            <Video className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-[11px] font-semibold text-slate-800">VIDEO</span>
          </div>

          {/* Track 2: Voiceover */}
          <div className="h-12 flex items-center px-3 gap-1.5 border-b border-slate-100">
            <Mic className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[11px] font-semibold text-slate-800">VOICE</span>
          </div>

          {/* Track 3: Music */}
          <div className="h-12 flex items-center px-3 gap-1.5">
            <Music className="w-3.5 h-3.5 text-cyan-600" />
            <span className="text-[11px] font-semibold text-slate-800">MUSIC</span>
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
            <div className="h-6 flex items-end relative bg-slate-50/70 border-b border-slate-200">
              {ticks.map((sec) => (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 flex flex-col justify-end pointer-events-none"
                  style={{ left: `${sec * zoom}px` }}
                >
                  <span className="text-[9px] font-mono text-slate-400 pl-1 pb-0.5 leading-none">
                    {formatTime(sec).slice(0, 5)}
                  </span>
                  <div className="w-[1px] h-1.5 bg-slate-300" />
                </div>
              ))}
            </div>

            {/* Playhead Indicator */}
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none transition-none"
              style={{ left: `${currentTime * zoom}px` }}
            >
              <div className="w-2 h-2 rotate-45 -ml-[3.5px] -mt-[2px] bg-blue-600 rounded-2xs" />
              <div className="w-[1.5px] h-full bg-blue-600" />
            </div>

            {/* Lane 1: Video Track Bar */}
            <div className="relative h-9 flex items-center px-1 border-b border-slate-100">
              <div
                className="h-6 rounded-md flex items-center gap-1.5 px-2 text-[10px] font-mono font-medium bg-sky-50 border border-sky-300 text-sky-800 shadow-2xs overflow-hidden"
                style={{ width: `${videoDuration * zoom}px` }}
              >
                <Film className="w-3 h-3 text-sky-600 flex-shrink-0" />
                <span className="truncate">{activeVideo?.name || 'Video Clip'}</span>
                <span className="text-sky-500 font-mono text-[9px] ml-auto">
                  {formatTime(videoDuration)}
                </span>
              </div>
            </div>

            {/* Lane 2: Voiceover Track */}
            {voiceTrack && (
              <TimelineTrack track={voiceTrack} zoom={zoom} totalDurationSec={totalDuration} />
            )}

            {/* Lane 3: Music Track */}
            {musicTrack && (
              <TimelineTrack track={musicTrack} zoom={zoom} totalDurationSec={totalDuration} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
