import React, { useState, useRef } from 'react'
import { X, Music, Sparkles, Upload, Play, Pause, Trash2, Check, RefreshCw } from 'lucide-react'
import { musicService } from './music-service'
import { getAudioContext } from '../../audio/audio-context'
import { getDecodedAudioBuffer } from '../../audio/audio-buffer-pool'
import { useProjectStore } from '../../stores/project-store'
import { commandBus } from '../../webmcp/bus'
import { formatTime } from '../../lib/utils'
import type { AudioAsset } from '../../contracts/project'
import type { MusicMood } from '../../contracts/audio'

interface MusicPanelProps {
  isOpen: boolean
  onClose: () => void
}

const MOOD_OPTIONS: { id: MusicMood; label: string; defaultPrompt: string }[] = [
  {
    id: 'ambient_minimal',
    label: 'Calm Cinematic',
    defaultPrompt: 'calm cinematic background music with soft ambient textures',
  },
  {
    id: 'energetic_tech',
    label: 'Modern Tech',
    defaultPrompt: 'upbeat modern electronic synth backing track',
  },
  {
    id: 'cinematic_reveal',
    label: 'Cinematic Reveal',
    defaultPrompt: 'deep dramatic build with low sub bass and pads',
  },
  {
    id: 'upbeat_fun',
    label: 'Upbeat & Groovy',
    defaultPrompt: 'cheerful groovy acoustic soundtrack for product video',
  },
]

export const MusicPanel: React.FC<MusicPanelProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'ai' | 'upload'>('ai')
  const [prompt, setPrompt] = useState(MOOD_OPTIONS[0].defaultPrompt)
  const [selectedMood, setSelectedMood] = useState<MusicMood>('ambient_minimal')
  const [durationSec, setDurationSec] = useState(30)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [generatedAsset, setGeneratedAsset] = useState<AudioAsset | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const currentProject = useProjectStore((state) => state.currentProject)
  const removeClip = useProjectStore((state) => state.removeClip)
  const addClipToTrack = useProjectStore((state) => state.addClipToTrack)

  if (!isOpen) return null

  const handleMoodSelect = (mood: MusicMood) => {
    setSelectedMood(mood)
    const opt = MOOD_OPTIONS.find((m) => m.id === mood)
    if (opt) {
      setPrompt(opt.defaultPrompt)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setProgressMsg('Generating music…')

    try {
      const asset = await musicService.generateMusic(
        {
          prompt: prompt.trim(),
          mood: selectedMood,
          durationSec,
          bpm: selectedMood === 'energetic_tech' ? 124 : 95,
          autoInsertToTimeline: true,
        },
        ({ message }) => {
          setProgressMsg(message)
        },
      )
      setGeneratedAsset(asset)
    } catch (err) {
      console.error('Music generation failed:', err)
      alert('Failed to generate music')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsGenerating(true)
    setProgressMsg('Importing audio file…')

    try {
      const file = files[0]
      const res = await commandBus.execute({
        type: 'asset.import',
        payload: { file },
      })

      if (res.success && res.data) {
        const asset = res.data as AudioAsset
        setGeneratedAsset(asset)

        // Insert to Music track
        if (currentProject) {
          const musicTrack = currentProject.tracks.find((t) => t.type === 'music')
          if (musicTrack) {
            addClipToTrack(musicTrack.id, {
              assetId: asset.id,
              name: asset.name,
              startSec: 0,
              durationSec: asset.durationSec,
              offsetSec: 0,
              gain: 1.0,
              fadeInSec: 0,
              fadeOutSec: 0,
            })
          }
        }
      } else {
        alert(res.error || 'Failed to upload audio file')
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload audio file')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = async () => {
    if (!generatedAsset) return
    const ctx = getAudioContext()
    if (previewing) {
      setPreviewing(false)
      return
    }

    try {
      const buffer = await getDecodedAudioBuffer(generatedAsset.id)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.onended = () => setPreviewing(false)
      source.start(0)
      setPreviewing(true)
    } catch (err) {
      console.error('Preview error:', err)
      setPreviewing(false)
    }
  }

  const handleDelete = () => {
    if (currentProject && generatedAsset) {
      const musicTrack = currentProject.tracks.find((t) => t.type === 'music')
      const clip = musicTrack?.clips.find((c) => c.assetId === generatedAsset.id)
      if (clip) {
        removeClip(clip.id)
      }
    }
    setGeneratedAsset(null)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4" style={{ color: 'var(--track-music)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Background Music
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost text-xs p-1"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Generated State Card */}
        {generatedAsset && (
          <div
            className="p-3 rounded-md flex flex-col gap-2.5"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                Background Track ({formatTime(generatedAsset.durationSec)})
              </span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                Added to track
              </span>
            </div>

            {/* Visual Bar representation */}
            <div
              className="h-4 rounded flex items-center px-2"
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                border: '1px solid var(--track-music)',
              }}
            >
              <div className="flex items-center gap-1 w-full overflow-hidden opacity-80">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--track-music)' }}
                  />
                ))}
              </div>
            </div>

            {/* Actions: Preview, Replace, Delete */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePreview}
                className="btn btn-secondary text-xs flex-1 py-1"
              >
                {previewing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{previewing ? 'Pause' : 'Preview'}</span>
              </button>

              <button
                type="button"
                onClick={() => setGeneratedAsset(null)}
                className="btn btn-secondary text-xs flex-1 py-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-ghost text-xs p-1 text-red-400 hover:text-red-300"
                title="Delete track"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {!generatedAsset && (
          <>
            {/* Mode Switch: Generate with AI vs Upload */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('ai')}
                className={`btn text-xs flex-1 py-1.5 ${tab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate with AI</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('upload')}
                className={`btn text-xs flex-1 py-1.5 ${tab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload audio</span>
              </button>
            </div>

            {tab === 'ai' ? (
              <>
                {/* AI Prompt Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                    Describe the music
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="calm cinematic background music"
                    className="textarea text-xs h-16"
                  />

                  {/* Preset mood chips */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleMoodSelect(m.id)}
                        className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                          selectedMood === m.id ? 'font-semibold' : ''
                        }`}
                        style={{
                          backgroundColor:
                            selectedMood === m.id
                              ? 'rgba(6, 182, 212, 0.2)'
                              : 'var(--surface-elevated)',
                          border: `1px solid ${
                            selectedMood === m.id ? 'var(--track-music)' : 'var(--border)'
                          }`,
                          color: selectedMood === m.id ? 'var(--track-music)' : 'var(--muted-foreground)',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Slider */}
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Duration
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={5}
                    value={durationSec}
                    onChange={(e) => setDurationSec(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--foreground)' }}>
                    {durationSec}s
                  </span>
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="btn btn-primary text-xs py-2 w-full mt-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGenerating ? progressMsg || 'Generating music…' : 'Generate'}</span>
                </button>
              </>
            ) : (
              /* Upload Mode */
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md gap-3" style={{ borderColor: 'var(--border)' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.wav,.mp3,.ogg,.m4a,.aac"
                  className="hidden"
                  onChange={handleAudioUpload}
                />
                <Music className="w-8 h-8" style={{ color: 'var(--muted-foreground)' }} />
                <div className="text-center">
                  <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                    Choose an audio file for background music
                  </p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    WAV, MP3, OGG, M4A
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating}
                  className="btn btn-secondary text-xs px-4 py-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isGenerating ? progressMsg || 'Importing…' : 'Select audio file'}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
