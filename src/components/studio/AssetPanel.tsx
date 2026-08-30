import React, { useState, useRef } from 'react'
import {
  Upload,
  Play,
  Pause,
  Trash2,
  Plus,
  FileAudio,
  Film,
  Music,
  Loader2,
} from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { useVideoStore } from '../../stores/video-store'
import { usePlaybackStore } from '../../stores/playback-store'
import { commandBus } from '../../webmcp/bus'
import { getDecodedAudioBuffer } from '../../audio/audio-buffer-pool'
import { getAudioContext } from '../../audio/audio-context'
import { formatTime } from '../../lib/utils'
import type { AudioAsset, TrackType } from '../../contracts/project'

export const AssetPanel: React.FC = () => {
  const { assets, currentProject } = useProjectStore()
  const { videos, selectVideo } = useVideoStore()
  const { setSidebarTab } = usePlaybackStore()
  const [activeMediaTab, setActiveMediaTab] = useState<'audio' | 'video'>('audio')
  const [isDragging, setIsDragging] = useState(false)
  const [previewingAssetId, setPreviewingAssetId] = useState<string | null>(null)
  const [extractingVideoId, setExtractingVideoId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const handleAudioFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (
        file.type.startsWith('audio/') ||
        /\.(wav|mp3|ogg|m4a|webm|flac|aac)$/i.test(file.name)
      ) {
        await commandBus.execute({
          type: 'asset.import',
          payload: { file },
        })
      }
    }
  }

  const handleVideoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      await commandBus.execute({
        type: 'video.import',
        payload: { file },
      })
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const first = files[0]
    if (first.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(first.name)) {
      setActiveMediaTab('video')
      await handleVideoFiles(files)
    } else {
      setActiveMediaTab('audio')
      await handleAudioFiles(files)
    }
  }

  const handlePreviewAudio = async (asset: AudioAsset) => {
    const ctx = getAudioContext()
    if (previewingAssetId === asset.id) {
      if (previewSourceRef.current) {
        previewSourceRef.current.stop()
        previewSourceRef.current.disconnect()
        previewSourceRef.current = null
      }
      setPreviewingAssetId(null)
      return
    }

    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.stop()
        previewSourceRef.current.disconnect()
      } catch {
        // Ignored
      }
    }

    try {
      const buffer = await getDecodedAudioBuffer(asset.id)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.onended = () => setPreviewingAssetId(null)
      source.start(0)
      previewSourceRef.current = source
      setPreviewingAssetId(asset.id)
    } catch (err) {
      console.error('Failed to preview asset:', err)
      setPreviewingAssetId(null)
    }
  }

  const handleAddToTimeline = async (asset: AudioAsset, preferredTrackType?: TrackType) => {
    if (!currentProject) return
    let targetTrack = currentProject.tracks.find(
      (t) =>
        t.type === (preferredTrackType || (asset.type === 'import' ? 'voiceover' : asset.type)),
    )
    if (!targetTrack && currentProject.tracks.length > 0) {
      targetTrack = currentProject.tracks[0]
    }
    if (!targetTrack) return

    let startSec = 0
    if (targetTrack.clips.length > 0) {
      const lastClip = targetTrack.clips[targetTrack.clips.length - 1]
      startSec = lastClip.startSec + lastClip.durationSec + 0.5
    }

    await commandBus.execute({
      type: 'timeline.addClip',
      payload: {
        trackId: targetTrack.id,
        assetId: asset.id,
        name: asset.name,
        startSec,
      },
    })
  }

  const handleDeleteAudio = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this audio asset from storage?')) {
      await commandBus.execute({
        type: 'asset.delete',
        payload: { assetId },
      })
    }
  }

  const handleDeleteVideo = async (videoAssetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this video asset from storage?')) {
      await commandBus.execute({
        type: 'video.delete',
        payload: { videoAssetId },
      })
    }
  }

  const handleExtractVideoAudio = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (extractingVideoId) return
    setExtractingVideoId(videoId)
    try {
      const res = await commandBus.execute({
        type: 'video.extractAudio',
        payload: { videoAssetId: videoId },
      })
      if (!res.success) {
        alert(res.error || 'Failed to extract audio')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Audio extraction error: ${msg}`)
    } finally {
      setExtractingVideoId(null)
    }
  }

  const getAssetBadge = (type: string) => {
    switch (type) {
      case 'voiceover':
        return <span className="badge badge-indigo">Voice</span>
      case 'music':
        return <span className="badge badge-cyan">Music</span>
      case 'sfx':
        return <span className="badge badge-amber">SFX</span>
      default:
        return <span className="badge badge-emerald">Import</span>
    }
  }

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Media Assets
          </h2>
          <p className="text-xs text-slate-400">Local project media library</p>
        </div>
      </div>

      {/* Media Type Toggle: Audio vs Video */}
      <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800 mb-3 gap-1">
        <button
          onClick={() => setActiveMediaTab('audio')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
            activeMediaTab === 'audio'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileAudio className="w-3.5 h-3.5" />
          <span>Audio ({assets.length})</span>
        </button>

        <button
          onClick={() => setActiveMediaTab('video')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
            activeMediaTab === 'video'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Video ({videos.length})</span>
        </button>
      </div>

      {/* File Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (activeMediaTab === 'audio') {
            fileInputRef.current?.click()
          } else {
            videoInputRef.current?.click()
          }
        }}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.wav,.mp3,.ogg,.m4a,.webm,.flac"
          multiple
          className="hidden"
          onChange={(e) => handleAudioFiles(e.target.files)}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*,.mp4,.webm,.mov,.mkv,.ogg,.avi,.m4v"
          multiple
          className="hidden"
          onChange={(e) => handleVideoFiles(e.target.files)}
        />

        <div className="flex flex-col items-center gap-1.5">
          <div className="p-2 bg-slate-800/80 rounded-full text-indigo-400">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-200">
              Drag & Drop {activeMediaTab} files or <span className="text-cyan-400">Browse</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {activeMediaTab === 'audio'
                ? 'WAV, MP3, OGG, FLAC, M4A'
                : 'MP4, WebM, MOV, MKV (Local IndexedDB)'}
            </p>
          </div>
        </div>
      </div>

      {/* Audio Assets View */}
      {activeMediaTab === 'audio' && (
        <div className="mt-3 flex flex-col gap-2 flex-1">
          {assets.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No audio assets imported yet. Upload audio, generate voiceover & music, or extract
              audio from video.
            </div>
          ) : (
            assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg p-3 flex flex-col gap-2 transition-all shadow-sm group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <button
                      onClick={() => handlePreviewAudio(asset)}
                      className={`p-1.5 rounded transition-all ${
                        previewingAssetId === asset.id
                          ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title={previewingAssetId === asset.id ? 'Pause Preview' : 'Audition Preview'}
                    >
                      {previewingAssetId === asset.id ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                    <div className="truncate">
                      <p
                        className="text-xs font-semibold text-slate-200 truncate"
                        title={asset.name}
                      >
                        {asset.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {formatTime(asset.durationSec)} • {asset.sampleRate}Hz •{' '}
                        {(asset.sizeBytes / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  {getAssetBadge(asset.type)}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAddToTimeline(asset)}
                      className="btn btn-secondary text-[11px] py-1 px-2 text-indigo-300 hover:text-white"
                      title="Add to timeline"
                    >
                      <Plus className="w-3 h-3" /> Add to Timeline
                    </button>
                    {asset.type === 'import' && (
                      <button
                        onClick={() => setSidebarTab('transcription')}
                        className="text-[11px] text-slate-400 hover:text-cyan-400 px-1.5 py-1 rounded hover:bg-slate-800"
                        title="Transcribe with Whisper STT"
                      >
                        Transcribe
                      </button>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteAudio(asset.id, e)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Delete asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Video Assets View */}
      {activeMediaTab === 'video' && (
        <div className="mt-3 flex flex-col gap-2 flex-1">
          {videos.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No video assets imported yet. Upload a video above to preview and extract audio.
            </div>
          ) : (
            videos.map((video) => (
              <div
                key={video.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg p-3 flex flex-col gap-2 transition-all shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-16 aspect-video bg-black rounded overflow-hidden flex-shrink-0 border border-slate-800">
                    {video.thumbnailDataUrl ? (
                      <img
                        src={video.thumbnailDataUrl}
                        alt={video.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Film className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="truncate flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate" title={video.name}>
                      {video.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {formatTime(video.durationSec)} • {video.metadata.width}x
                      {video.metadata.height} • {(video.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        selectVideo(video.id)
                        setSidebarTab('video')
                      }}
                      className="btn btn-secondary text-[11px] py-1 px-2 text-cyan-300 hover:text-white"
                      title="Open in Video Workspace"
                    >
                      <Play className="w-3 h-3 fill-current" /> Preview
                    </button>

                    <button
                      onClick={(e) => handleExtractVideoAudio(video.id, e)}
                      disabled={extractingVideoId === video.id || !video.metadata.hasAudio}
                      className="btn btn-secondary text-[11px] py-1 px-2 text-indigo-300 hover:text-white"
                      title="Extract audio soundtrack"
                    >
                      {extractingVideoId === video.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Extracting...
                        </>
                      ) : (
                        <>
                          <Music className="w-3 h-3" /> Extract Audio
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleDeleteVideo(video.id, e)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Delete video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
