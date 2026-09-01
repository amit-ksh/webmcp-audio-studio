import React, { useState } from 'react'
import { X, Mic, Sparkles } from 'lucide-react'
import { voiceoverService } from './voiceover-service'
import { useProjectStore } from '../../stores/project-store'
import type { AudioAsset } from '../../contracts/project'

interface VoiceoverPanelProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'add' | 'replace'
}

const TEMPLATES = [
  'Welcome to our product walkthrough. In this video, we explore core features.',
  'Introducing the next generation platform built for modern creative workflows.',
  'Easily edit audio, synthesize voiceovers, and generate backing music in your browser.',
]

const VOICES = [
  { id: 'narrator_male', name: 'Tech Narrator (Male)' },
  { id: 'narrator_female', name: 'SaaS Host (Female)' },
  { id: 'energetic_launch', name: 'Launch Energy (Male/Bright)' },
  { id: 'executive_calm', name: 'Executive Calm (Deep)' },
]

export const VoiceoverPanel: React.FC<VoiceoverPanelProps> = ({
  isOpen,
  onClose,
  mode = 'add',
}) => {
  const [scriptText, setScriptText] = useState(TEMPLATES[0])
  const [voiceId, setVoiceId] = useState('narrator_male')
  const [speed, setSpeed] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const removeClip = useProjectStore((state) => state.removeClip)
  const addClipToTrack = useProjectStore((state) => state.addClipToTrack)

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!scriptText.trim()) return
    setIsGenerating(true)
    setProgressMsg('Synthesizing speech...')
    setError(null)

    try {
      const asset = await voiceoverService.generateVoiceover(
        {
          text: scriptText.trim(),
          voiceId,
          speed,
          pitch: 1,
          autoInsertToTimeline: mode === 'add',
        },
        ({ message }) => setProgressMsg(message),
      )

      if (mode === 'replace') {
        const voiceTrack = useProjectStore
          .getState()
          .currentProject?.tracks.find((track) => track.type === 'voiceover')
        if (voiceTrack) {
          voiceTrack.clips.forEach((clip) => removeClip(clip.id))
          addVoiceClip(voiceTrack.id, asset)
        }
      }
      onClose()
    } catch (generationError) {
      console.error('Voiceover generation failed:', generationError)
      setError('Voiceover generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const addVoiceClip = (trackId: string, asset: AudioAsset) => {
    addClipToTrack(trackId, {
      assetId: asset.id,
      name: `Narration: ${scriptText.trim().slice(0, 16)}...`,
      startSec: 0,
      durationSec: asset.durationSec,
      offsetSec: 0,
      gain: 1,
      fadeInSec: 0.05,
      fadeOutSec: 0.05,
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-30" aria-hidden="true" onMouseDown={onClose} />
      <section
        role="dialog"
        aria-label={mode === 'replace' ? 'Change voiceover' : 'Generate voiceover'}
        className="absolute bottom-full right-0 z-40 mb-2 flex max-h-[min(72dvh,520px)] w-[400px] max-w-[calc(100vw-2rem)] flex-col gap-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)]"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-purple-600">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {mode === 'replace' ? 'Change voiceover' : 'Generate voiceover'}
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {mode === 'replace'
                  ? 'Replaces voice clips without changing background music'
                  : 'Adds a new clip to the voice track'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close voiceover popover"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-800" htmlFor="voiceover-script">
              Script
            </label>
            <span className="font-mono text-[10px] text-slate-400">
              {scriptText.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <textarea
            id="voiceover-script"
            value={scriptText}
            onChange={(event) => setScriptText(event.target.value)}
            placeholder="Enter your script"
            className="textarea h-24 rounded-xl border-slate-200 text-xs"
          />
          <div className="mt-1 flex flex-wrap gap-1.5">
            {TEMPLATES.map((template, index) => (
              <button
                key={template}
                type="button"
                onClick={() => setScriptText(template)}
                className="max-w-[110px] truncate rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
              >
                Template {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-800" htmlFor="voice-persona">
              Voice
            </label>
            <select
              id="voice-persona"
              value={voiceId}
              onChange={(event) => setVoiceId(event.target.value)}
              className="select rounded-xl border-slate-200 py-2 text-xs"
            >
              {VOICES.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-28 flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-800" htmlFor="voice-speed">
              Speed {speed.toFixed(2)}x
            </label>
            <input
              id="voice-speed"
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={speed}
              onChange={(event) => setSpeed(parseFloat(event.target.value))}
              className="cursor-pointer"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!scriptText.trim() || isGenerating}
          className="btn btn-primary w-full rounded-xl py-2.5 text-xs font-bold"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            {isGenerating
              ? progressMsg || 'Synthesizing speech...'
              : mode === 'replace'
                ? 'Change voiceover'
                : 'Generate voiceover'}
          </span>
        </button>
      </section>
    </>
  )
}
