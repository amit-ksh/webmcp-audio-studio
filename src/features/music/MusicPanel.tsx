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
    setProgressMsg('Generating backing track…')

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
        className="modal-dialog p-6 flex flex-col gap-5 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200">
              <Music className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Background Music
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close background music dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Generated State Card */}
        {generatedAsset && (
          <div className="p-4 rounded-xl flex flex-col gap-3 bg-cyan-50/70 border border-cyan-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5 text-cyan-950">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Background Track ({formatTime(generatedAsset.durationSec)})
              </span>
              <span className="font-mono text-[10px] text-cyan-700 font-medium bg-cyan-100 px-2 py-0.5 rounded-md">
                Added to track
              </span>
            </div>

            {/* Visual Bar representation */}
            <div className="h-5 rounded-lg flex items-center px-2 bg-cyan-100 border border-cyan-300">
              <div className="flex items-center gap-1 w-full overflow-hidden opacity-90">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-2.5 rounded-full bg-cyan-600"
                  />
                ))}
              </div>
            </div>

            {/* Actions: Preview, Replace, Delete */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePreview}
                className="btn btn-secondary text-xs flex-1 py-1.5 rounded-lg font-medium text-slate-800"
              >
                {previewing ? <Pause className="w-3 h-3 text-cyan-600" /> : <Play className="w-3 h-3 fill-current text-cyan-600" />}
                <span>{previewing ? 'Pause' : 'Preview audio'}</span>
              </button>

              <button
                type="button"
                onClick={() => setGeneratedAsset(null)}
                className="btn btn-secondary text-xs flex-1 py-1.5 rounded-lg font-medium text-slate-800"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete track"
              >
                <Trash2 className="w-4 h-4" />
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
                className={`btn text-xs flex-1 py-2 rounded-xl font-semibold ${
                  tab === 'ai'
                    ? 'btn-primary'
                    : 'btn-secondary text-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate with AI</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('upload')}
                className={`btn text-xs flex-1 py-2 rounded-xl font-semibold ${
                  tab === 'upload'
                    ? 'btn-primary'
                    : 'btn-secondary text-slate-700'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload audio file</span>
              </button>
            </div>

            {tab === 'ai' ? (
              <>
                {/* AI Prompt Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-800">
                    Describe the music
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="calm cinematic background music"
                    className="textarea text-xs h-20 rounded-xl border-slate-200"
                  />

                  {/* Preset mood chips */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleMoodSelect(m.id)}
                        className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                          selectedMood === m.id
                            ? 'bg-cyan-100 text-cyan-800 border border-cyan-300 font-semibold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Slider */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="text-xs font-medium text-slate-600">
                    Duration
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={5}
                    value={durationSec}
                    onChange={(e) => setDurationSec(parseInt(e.target.value))}
                    className="flex-1 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-semibold text-slate-800 w-8 text-right">
                    {durationSec}s
                  </span>
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="btn btn-primary text-xs py-2.5 w-full rounded-xl font-bold shadow-md mt-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGenerating ? progressMsg || 'Synthesizing music…' : 'Generate background music'}</span>
                </button>
              </>
            ) : (
              /* Upload Mode */
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl gap-3 bg-slate-50/50">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.wav,.mp3,.ogg,.m4a,.aac"
                  style={{ display: 'none' }}
                  onChange={handleAudioUpload}
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-cyan-600">
                  <Music className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800">
                    Choose an audio file for background music
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    WAV, MP3, OGG, M4A
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating}
                  className="btn btn-secondary text-xs px-5 py-2 rounded-xl font-semibold shadow-2xs mt-1"
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
