import React, { useRef, useState } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Camera,
  Music,
  CheckCircle,
  Loader2,
  Maximize2,
} from 'lucide-react'
import { useVideoStore } from '../../../stores/video-store'
import { usePlaybackStore } from '../../../stores/playback-store'
import { commandBus } from '../../../webmcp/bus'
import { formatTime } from '../../../lib/utils'

export const VideoPlayer: React.FC = () => {
  const {
    videos,
    selectedVideoId,
    activeVideoObjectUrl,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    volume,
    setPlaybackState,
  } = useVideoStore()
  const { setSidebarTab } = usePlaybackStore()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isExtractingAudio, setIsExtractingAudio] = useState(false)
  const [extractSuccess, setExtractSuccess] = useState(false)
  const [isCapturingFrame, setIsCapturingFrame] = useState(false)
  const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(null)

  const activeVideo = videos.find((v) => v.id === selectedVideoId)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setPlaybackState({ isPlaying: false })
    } else {
      videoRef.current.play()
      setPlaybackState({ isPlaying: true })
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setPlaybackState({
      currentTime: videoRef.current.currentTime,
      duration: videoRef.current.duration || duration,
    })
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime
      setPlaybackState({ currentTime: targetTime })
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    const nextMuted = !isMuted
    videoRef.current.muted = nextMuted
    setPlaybackState({ isMuted: nextMuted })
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVol = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = nextVol
      videoRef.current.muted = nextVol === 0
      setPlaybackState({ volume: nextVol, isMuted: nextVol === 0 })
    }
  }

  const handleExtractAudio = async () => {
    if (!selectedVideoId || isExtractingAudio) return
    setIsExtractingAudio(true)
    setExtractSuccess(false)

    try {
      const res = await commandBus.execute({
        type: 'video.extractAudio',
        payload: { videoAssetId: selectedVideoId },
      })

      if (res.success) {
        setExtractSuccess(true)
        setTimeout(() => setExtractSuccess(false), 4000)
      } else {
        alert(res.error || 'Failed to extract audio')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Audio extraction error: ${msg}`)
    } finally {
      setIsExtractingAudio(false)
    }
  }

  const handleCaptureFrame = async () => {
    if (!selectedVideoId || isCapturingFrame) return
    setIsCapturingFrame(true)

    try {
      const res = await commandBus.execute({
        type: 'video.getFrame',
        payload: {
          videoAssetId: selectedVideoId,
          timeSec: currentTime,
        },
      })

      if (res.success && res.data) {
        const data = res.data as { dataUrl: string }
        setCapturedFrameUrl(data.dataUrl)
      } else {
        alert(res.error || 'Failed to capture frame')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Frame capture error: ${msg}`)
    } finally {
      setIsCapturingFrame(false)
    }
  }

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    }
  }

  if (!activeVideo || !activeVideoObjectUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-52 bg-slate-900/40 border border-slate-800/80 rounded-xl text-slate-500 text-xs p-6 text-center">
        <p>No video selected for preview.</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Select or upload a video asset to watch and inspect playback.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 bg-slate-950/90 border border-slate-800/90 rounded-xl p-3 shadow-lg">
      {/* Video Viewport */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center group">
        <video
          ref={videoRef}
          src={activeVideoObjectUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPlaybackState({ isPlaying: false })}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          playsInline
        />

        {/* Video Overlays: Resolution & Audio badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <span className="badge badge-cyan text-[10px] shadow-sm">
            {activeVideo.metadata.width}x{activeVideo.metadata.height}
          </span>
          <span className="badge badge-indigo text-[10px] shadow-sm">
            {activeVideo.metadata.frameRate} FPS
          </span>
          {activeVideo.metadata.hasAudio && (
            <span className="badge badge-emerald text-[10px] shadow-sm">Audio Track</span>
          )}
        </div>

        {/* Center Play/Pause button on hover */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-950/70 border border-slate-700/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-xl"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={handleFullscreen}
          className="absolute top-2 right-2 p-1.5 rounded bg-slate-950/60 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          title="Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrub bar */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={duration || activeVideo.durationSec || 1}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || activeVideo.durationSec)}</span>
        </div>
      </div>

      {/* Transport Controls & Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
        {/* Left: Playback & Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-sm shadow-cyan-500/20"
            title={isPlaying ? 'Pause Video' : 'Play Video'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-14 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Right: Frame capture & Extract Audio */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCaptureFrame}
            disabled={isCapturingFrame}
            className="btn btn-secondary text-xs py-1.5 px-2.5 text-slate-300 hover:text-cyan-300"
            title="Capture frame snapshot at current playhead"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Frame</span>
          </button>

          <button
            onClick={handleExtractAudio}
            disabled={isExtractingAudio}
            className={`btn text-xs py-1.5 px-3 font-semibold transition-all ${
              extractSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/20'
            }`}
            title="Extract audio soundtrack into project library for Whisper transcription & editing"
          >
            {isExtractingAudio ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : extractSuccess ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Audio Extracted!</span>
              </>
            ) : (
              <>
                <Music className="w-3.5 h-3.5" />
                <span>Extract Audio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Frame Capture Modal / Preview */}
      {capturedFrameUrl && (
        <div className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300">
              Captured Frame at {formatTime(currentTime)}
            </span>
            <button
              onClick={() => setCapturedFrameUrl(null)}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <img
            src={capturedFrameUrl}
            alt="Captured Frame"
            className="rounded border border-slate-800 w-full max-h-36 object-contain bg-black"
          />
        </div>
      )}

      {/* Link to Transcription if audio was extracted */}
      {activeVideo.associatedAudioAssetId && (
        <div className="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audio track is in Project Library</span>
          </div>
          <button
            onClick={() => setSidebarTab('transcription')}
            className="btn btn-secondary text-[10px] py-0.5 px-2 text-cyan-300 hover:text-white"
          >
            Transcribe with Whisper →
          </button>
        </div>
      )}
    </div>
  )
}
