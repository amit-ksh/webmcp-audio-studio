import React, { useState, useRef } from 'react'
import { Upload, Play, Pause, Trash2, Plus } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { usePlaybackStore } from '../../stores/playback-store'
import { commandBus } from '../../webmcp/bus'
import { getDecodedAudioBuffer } from '../../audio/audio-buffer-pool'
import { getAudioContext } from '../../audio/audio-context'
import { formatTime } from '../../lib/utils'
import type { AudioAsset, TrackType } from '../../contracts/project'

export const AssetPanel: React.FC = () => {
  const { assets, currentProject } = useProjectStore()
  const { setSidebarTab } = usePlaybackStore()
  const [isDragging, setIsDragging] = useState(false)
  const [previewingAssetId, setPreviewingAssetId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('audio/') || /\.(wav|mp3|ogg|m4a|webm|flac|aac)$/i.test(file.name)) {
        await commandBus.execute({
          type: 'asset.import',
          payload: { file },
        })
      }
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    await handleFiles(e.dataTransfer.files)
  }

  const handlePreview = async (asset: AudioAsset) => {
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
      (t) => t.type === (preferredTrackType || (asset.type === 'import' ? 'voiceover' : asset.type)),
    )
    if (!targetTrack && currentProject.tracks.length > 0) {
      targetTrack = currentProject.tracks[0]
    }
    if (!targetTrack) return

    // Find first available start position after existing clips on track
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

  const handleDeleteAsset = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this audio asset from storage?')) {
      await commandBus.execute({
        type: 'asset.delete',
        payload: { assetId },
      })
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Audio Assets</h2>
          <p className="text-xs text-slate-400">Local project media library</p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
          {assets.length} items
        </span>
      </div>

      {/* File Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
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
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="p-2.5 bg-slate-800/80 rounded-full text-indigo-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-200">
              Drag & Drop audio files here or <span className="text-indigo-400">Browse</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">WAV, MP3, OGG, FLAC, M4A, WebM</p>
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div className="mt-4 flex flex-col gap-2 flex-1">
        {assets.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No audio assets imported yet. Upload audio or generate voiceover & music to get started.
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
                    onClick={() => handlePreview(asset)}
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
                    <p className="text-xs font-semibold text-slate-200 truncate" title={asset.name}>
                      {asset.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {formatTime(asset.durationSec)} • {asset.sampleRate}Hz • {(asset.sizeBytes / 1024).toFixed(0)} KB
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
                  onClick={(e) => handleDeleteAsset(asset.id, e)}
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
    </div>
  )
}
