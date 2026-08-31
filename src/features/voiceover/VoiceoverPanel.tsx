import React, { useState } from 'react'
import { X, Mic, Sparkles, Play, Pause, Trash2, Check, RefreshCw } from 'lucide-react'
import { voiceoverService } from './voiceover-service'
import { getAudioContext } from '../../audio/audio-context'
import { getDecodedAudioBuffer } from '../../audio/audio-buffer-pool'
import { useProjectStore } from '../../stores/project-store'
import { formatTime } from '../../lib/utils'
import type { AudioAsset } from '../../contracts/project'

interface VoiceoverPanelProps {
  isOpen: boolean
  onClose: () => void
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

export const VoiceoverPanel: React.FC<VoiceoverPanelProps> = ({ isOpen, onClose }) => {
  const [scriptText, setScriptText] = useState(TEMPLATES[0])
  const [voiceId, setVoiceId] = useState('narrator_male')
  const [speed, setSpeed] = useState(1.0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [generatedAsset, setGeneratedAsset] = useState<AudioAsset | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const currentProject = useProjectStore((state) => state.currentProject)
  const removeClip = useProjectStore((state) => state.removeClip)

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!scriptText.trim()) return
    setIsGenerating(true)
    setProgressMsg('Synthesizing speech…')

    try {
      const asset = await voiceoverService.generateVoiceover(
        {
          text: scriptText.trim(),
          voiceId,
          speed,
          pitch: 1.0,
          autoInsertToTimeline: true,
        },
        ({ message }) => {
          setProgressMsg(message)
        },
      )
      setGeneratedAsset(asset)
    } catch (err) {
      console.error('Voiceover generation failed:', err)
      alert('Failed to generate voiceover')
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
      const voiceTrack = currentProject.tracks.find((t) => t.type === 'voiceover')
      const clip = voiceTrack?.clips.find((c) => c.assetId === generatedAsset.id)
      if (clip) {
        removeClip(clip.id)
      }
    }
    setGeneratedAsset(null)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog p-6 flex flex-col gap-4 bg-white border border-slate-200 shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
              <Mic className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Add Voiceover
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Generated State Card if asset is ready */}
        {generatedAsset && (
          <div className="p-4 rounded-xl flex flex-col gap-3 bg-purple-50/70 border border-purple-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5 text-purple-900">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Voiceover ({formatTime(generatedAsset.durationSec)})
              </span>
              <span className="font-mono text-[10px] text-purple-700 font-medium bg-purple-100 px-2 py-0.5 rounded-md">
                Added to track
              </span>
            </div>

            {/* Visual Bar representation */}
            <div className="h-5 rounded-lg flex items-center px-2 bg-purple-100 border border-purple-300">
              <div className="flex items-center gap-1 w-full overflow-hidden opacity-90">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-2.5 rounded-full bg-purple-600"
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
                {previewing ? <Pause className="w-3 h-3 text-purple-600" /> : <Play className="w-3 h-3 fill-current text-purple-600" />}
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
                title="Delete voiceover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input & Form */}
        {!generatedAsset && (
          <>
            {/* Script Text */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-800">
                  Script
                </label>
                <span className="font-mono text-[11px] text-slate-400">
                  {scriptText.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Enter your script..."
                className="textarea text-xs h-24 rounded-xl border-slate-200"
              />

              {/* Template chips */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setScriptText(t)}
                    className="text-[10px] px-2.5 py-1 rounded-md transition-colors truncate max-w-[200px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                  >
                    Template {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Voice Persona
              </label>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="select text-xs rounded-xl border-slate-200 py-2"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed slider */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="text-xs font-medium text-slate-600">
                Speed
              </label>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="flex-1 cursor-pointer"
              />
              <span className="text-xs font-mono font-semibold text-slate-800 w-8 text-right">
                {speed.toFixed(2)}x
              </span>
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!scriptText.trim() || isGenerating}
              className="btn btn-primary text-xs py-2.5 w-full rounded-xl font-bold shadow-md mt-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? progressMsg || 'Synthesizing speech…' : 'Generate voiceover'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
