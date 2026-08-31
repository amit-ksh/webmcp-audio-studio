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
    setProgressMsg('Generating voiceover…')

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
        className="modal-dialog p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4" style={{ color: 'var(--track-voice)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Voiceover
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

        {/* Generated State Card if asset is ready */}
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
                Voiceover ({formatTime(generatedAsset.durationSec)})
              </span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                Added to track
              </span>
            </div>

            {/* Visual Bar representation */}
            <div
              className="h-4 rounded flex items-center px-2"
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid var(--track-voice)',
              }}
            >
              <div className="flex items-center gap-1 w-full overflow-hidden opacity-80">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--track-voice)' }}
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
                title="Delete voiceover"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Input & Form (shown when creating or replacing) */}
        {!generatedAsset && (
          <>
            {/* Script Text */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium" style={{ color: 'var(--foreground)' }}>
                  Script
                </label>
                <span className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                  {scriptText.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Enter your script..."
                className="textarea text-xs h-20"
              />

              {/* Template chips */}
              <div className="flex flex-wrap gap-1 mt-1">
                {TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setScriptText(t)}
                    className="text-[10px] px-2 py-0.5 rounded transition-colors truncate max-w-[200px]"
                    style={{
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    Template {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                Voice
              </label>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="select text-xs"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed slider */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Speed
              </label>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--foreground)' }}>
                {speed.toFixed(2)}x
              </span>
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!scriptText.trim() || isGenerating}
              className="btn btn-primary text-xs py-2 w-full mt-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? progressMsg || 'Generating voiceover…' : 'Generate'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
