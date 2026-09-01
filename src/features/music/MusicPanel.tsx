import React, { useRef, useState } from 'react'
import { X, Music, Sparkles, Upload } from 'lucide-react'
import { musicService } from './music-service'
import { useProjectStore } from '../../stores/project-store'
import { commandBus } from '../../webmcp/bus'
import type { AudioAsset } from '../../contracts/project'
import type { MusicMood } from '../../contracts/audio'

interface MusicPanelProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'add' | 'replace'
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

export const MusicPanel: React.FC<MusicPanelProps> = ({ isOpen, onClose, mode = 'add' }) => {
  const [tab, setTab] = useState<'ai' | 'upload'>('ai')
  const [prompt, setPrompt] = useState(MOOD_OPTIONS[0].defaultPrompt)
  const [selectedMood, setSelectedMood] = useState<MusicMood>('ambient_minimal')
  const [durationSec, setDurationSec] = useState(30)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const addClipToTrack = useProjectStore((state) => state.addClipToTrack)
  const removeClip = useProjectStore((state) => state.removeClip)

  if (!isOpen) return null

  const handleMoodSelect = (mood: MusicMood) => {
    setSelectedMood(mood)
    const option = MOOD_OPTIONS.find((item) => item.id === mood)
    if (option) setPrompt(option.defaultPrompt)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setProgressMsg('Generating backing track...')
    setError(null)

    try {
      const asset = await musicService.generateMusic(
        {
          prompt: prompt.trim(),
          mood: selectedMood,
          durationSec,
          bpm: selectedMood === 'energetic_tech' ? 124 : 95,
          autoInsertToTimeline: mode === 'add',
        },
        ({ message }) => setProgressMsg(message),
      )
      if (mode === 'replace') replaceMusicTrack(asset)
      onClose()
    } catch (generationError) {
      console.error('Music generation failed:', generationError)
      setError('Background music generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsGenerating(true)
    setProgressMsg('Importing audio file...')
    setError(null)

    try {
      const result = await commandBus.execute({
        type: 'asset.import',
        payload: { file },
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to upload audio file')
      }

      const asset = result.data as AudioAsset
      if (mode === 'replace') replaceMusicTrack(asset)
      else addMusicClip(asset)
      onClose()
    } catch (uploadError) {
      console.error('Upload failed:', uploadError)
      setError('Audio import failed. Please try another file.')
    } finally {
      setIsGenerating(false)
    }
  }

  const addMusicClip = (asset: AudioAsset) => {
    const musicTrack = useProjectStore
      .getState()
      .currentProject?.tracks.find((track) => track.type === 'music')
    if (!musicTrack) return
    addClipToTrack(musicTrack.id, {
      assetId: asset.id,
      name: asset.name,
      startSec: 0,
      durationSec: asset.durationSec,
      offsetSec: 0,
      gain: 1,
      fadeInSec: 0,
      fadeOutSec: 0,
    })
  }

  const replaceMusicTrack = (asset: AudioAsset) => {
    const musicTrack = useProjectStore
      .getState()
      .currentProject?.tracks.find((track) => track.type === 'music')
    if (!musicTrack) return
    musicTrack.clips.forEach((clip) => removeClip(clip.id))
    addMusicClip(asset)
  }

  return (
    <>
      <div className="fixed inset-0 z-30" aria-hidden="true" onMouseDown={onClose} />
      <section
        role="dialog"
        aria-label={mode === 'replace' ? 'Change background music' : 'Add background music'}
        className="absolute bottom-full right-0 z-40 mb-2 flex max-h-[min(72dvh,560px)] w-[420px] max-w-[calc(100vw-2rem)] flex-col gap-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)]"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-600">
              <Music className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {mode === 'replace' ? 'Change background music' : 'Background music'}
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {mode === 'replace'
                  ? 'Replaces BGM without changing voiceover clips'
                  : 'Adds audio directly to the music track'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close background music popover"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab('ai')}
            className={`btn rounded-lg py-1.5 text-xs font-semibold ${tab === 'ai' ? 'bg-white text-slate-900 shadow-2xs' : 'btn-ghost text-slate-500'}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`btn rounded-lg py-1.5 text-xs font-semibold ${tab === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'btn-ghost text-slate-500'}`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload</span>
          </button>
        </div>

        {tab === 'ai' ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-800" htmlFor="music-prompt">
                Describe the music
              </label>
              <textarea
                id="music-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Calm cinematic background music"
                className="textarea h-20 rounded-xl border-slate-200 text-xs"
              />
              <div className="mt-1 flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => handleMoodSelect(mood.id)}
                    className={`rounded-md px-2.5 py-1 text-[10px] transition-colors ${
                      selectedMood === mood.id
                        ? 'border border-cyan-300 bg-cyan-100 font-semibold text-cyan-800'
                        : 'bg-slate-100 font-medium text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-600" htmlFor="music-duration">
                Duration
              </label>
              <input
                id="music-duration"
                type="range"
                min={10}
                max={120}
                step={5}
                value={durationSec}
                onChange={(event) => setDurationSec(parseInt(event.target.value))}
                className="flex-1 cursor-pointer"
              />
              <span className="w-9 text-right font-mono text-xs font-semibold text-slate-800">
                {durationSec}s
              </span>
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="btn btn-primary w-full rounded-xl py-2.5 text-xs font-bold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {isGenerating
                  ? progressMsg || 'Synthesizing music...'
                  : mode === 'replace'
                    ? 'Change background music'
                    : 'Generate music'}
              </span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.wav,.mp3,.ogg,.m4a,.aac"
              className="hidden"
              onChange={handleAudioUpload}
            />
            <div>
              <p className="text-xs font-semibold text-slate-800">
                {mode === 'replace' ? 'Choose replacement audio' : 'Upload background audio'}
              </p>
              <p className="mt-1 text-[10px] font-mono text-slate-400">WAV, MP3, OGG, M4A</p>
            </div>
            {error && <p className="text-[11px] text-red-700">{error}</p>}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              className="btn btn-secondary rounded-lg px-4 py-2 text-xs font-semibold"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{isGenerating ? progressMsg || 'Importing...' : 'Choose audio file'}</span>
            </button>
          </div>
        )}
      </section>
    </>
  )
}
