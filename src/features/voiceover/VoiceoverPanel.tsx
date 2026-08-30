import React, { useState } from 'react'
import { Mic, Sparkles, UserCheck, Play, Pause, Check } from 'lucide-react'
import { voiceoverService } from './voiceover-service'
import { usePlaybackStore } from '../../stores/playback-store'
import { getAudioContext } from '../../audio/audio-context'
import { getDecodedAudioBuffer } from '../../audio/audio-buffer-pool'
import { formatTime } from '../../lib/utils'
import type { AudioAsset } from '../../contracts/project'

const TEMPLATE_SCRIPTS = [
  {
    title: 'SaaS Product Launch',
    text: 'Introducing our new AI-powered platform. Built for modern software teams to ship 10x faster.',
  },
  {
    title: 'Feature Explainer',
    text: 'With intelligent automation and real-time audio ducking, your marketing demos sound studio-mastered.',
  },
  {
    title: 'Developer Demo',
    text: 'Seamlessly controlled via WebMCP browser agents, directly executing your audio creation pipeline.',
  },
]

const VOICES = [
  {
    id: 'narrator_male',
    name: 'Tech Narrator',
    gender: 'Male',
    tone: 'Warm, Confident & Authoritative',
    desc: 'Ideal for product overviews, developer walkthroughs, and main narrations.',
  },
  {
    id: 'narrator_female',
    name: 'SaaS Host',
    gender: 'Female',
    tone: 'Crisp, Engaging & Articulate',
    desc: 'Great for feature explainers, customer onboarding, and tutorial videos.',
  },
  {
    id: 'energetic_launch',
    name: 'Launch Energy',
    gender: 'Male/Bright',
    tone: 'Dynamic, High-Tempo & Punchy',
    desc: 'Best for product launch teasers, marketing hype, and promo sizzle reels.',
  },
  {
    id: 'executive_calm',
    name: 'Executive Calm',
    gender: 'Deep',
    tone: 'Deep, Resonant & Steady',
    desc: 'Perfect for investor pitches, case studies, and enterprise presentations.',
  },
]

export const VoiceoverPanel: React.FC = () => {
  const { setSidebarTab } = usePlaybackStore()
  const [scriptText, setScriptText] = useState(TEMPLATE_SCRIPTS[0].text)
  const [voiceId, setVoiceId] = useState('narrator_male')
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(1.0)
  const [autoInsert, setAutoInsert] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [lastGeneratedAsset, setLastGeneratedAsset] = useState<AudioAsset | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const handleGenerate = async () => {
    if (!scriptText.trim()) return
    setIsGenerating(true)
    setProgress(15)
    setStatusMessage('Generating vocal track...')

    try {
      const asset = await voiceoverService.generateVoiceover(
        {
          text: scriptText.trim(),
          voiceId,
          speed,
          pitch,
          autoInsertToTimeline: autoInsert,
        },
        ({ progress: prog, message }) => {
          setProgress(prog)
          setStatusMessage(message)
        },
      )
      setLastGeneratedAsset(asset)
    } catch (err) {
      console.error('Failed to generate voiceover:', err)
      alert('Failed to generate voiceover speech')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = async () => {
    if (!lastGeneratedAsset) return
    const ctx = getAudioContext()
    if (previewing) {
      setPreviewing(false)
      return
    }

    try {
      const buffer = await getDecodedAudioBuffer(lastGeneratedAsset.id)
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

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-violet-950/60 border border-violet-500/30 text-violet-400 shadow-sm">
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Voiceover Studio
          </h2>
          <p className="text-xs text-slate-400">Multi-Timbre TTS in Web Worker</p>
        </div>
      </div>

      {/* Preset Script Chips */}
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-400">Script Templates</label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_SCRIPTS.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setScriptText(t.text)}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Script Text Input */}
      <div className="flex flex-col gap-1.5 mt-3">
        <label className="text-xs font-semibold text-slate-300">Narration Script</label>
        <textarea
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          placeholder="Enter product pitch, narration, or explainer script..."
          className="textarea text-xs h-24"
        />
        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
          <span>{scriptText.split(/\s+/).filter(Boolean).length} words</span>
          <span>~{Math.ceil((scriptText.split(/\s+/).filter(Boolean).length / 2.5) / speed)}s duration</span>
        </div>
      </div>

      {/* Voice Persona Selection */}
      <div className="flex flex-col gap-2 mt-3">
        <label className="text-xs font-semibold text-slate-300">Voice Persona</label>
        <div className="grid grid-cols-1 gap-2">
          {VOICES.map((v) => (
            <div
              key={v.id}
              onClick={() => setVoiceId(v.id)}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                voiceId === v.id
                  ? 'bg-violet-950/60 border-violet-500 text-white shadow-sm shadow-violet-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <UserCheck className={`w-3.5 h-3.5 ${voiceId === v.id ? 'text-violet-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">{v.name}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {v.gender}
                </span>
              </div>
              <p className="text-[11px] text-violet-300/90 font-medium mt-0.5">{v.tone}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Speed & Pitch Controls */}
      <div className="grid grid-cols-2 gap-3 mt-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Speed</span>
            <span className="font-mono text-cyan-400 font-bold">{speed.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.75"
            step="0.05"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="accent-violet-500 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Pitch</span>
            <span className="font-mono text-violet-400 font-bold">{pitch.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.25"
            step="0.05"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="accent-violet-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Auto-Insert Toggle */}
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="text-xs text-slate-300">Auto-add clip to Voiceover Track</span>
        <input
          type="checkbox"
          checked={autoInsert}
          onChange={(e) => setAutoInsert(e.target.checked)}
          className="accent-violet-500 cursor-pointer w-4 h-4"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!scriptText.trim() || isGenerating}
        className="btn btn-accent mt-4 w-full text-xs py-2 shadow-md shadow-violet-600/30"
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating ? 'Synthesizing Speech...' : 'Generate Voiceover'}
      </button>

      {/* Progress */}
      {isGenerating && (
        <div className="bg-slate-900/90 border border-violet-500/30 rounded-lg p-3 mt-3 flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between text-xs font-medium text-violet-400">
            <span>{statusMessage}</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-indigo-400 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Last Generated Preview Card */}
      {lastGeneratedAsset && (
        <div className="mt-4 bg-slate-900 border border-violet-500/40 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Voiceover Ready</span>
            </div>
            <span className="text-[10px] font-mono text-violet-400">
              {formatTime(lastGeneratedAsset.durationSec)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handlePreview}
              className="btn btn-secondary flex-1 text-xs py-1.5"
            >
              {previewing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {previewing ? 'Pause Preview' : 'Audition Audio'}
            </button>
            <button
              onClick={() => setSidebarTab('assets')}
              className="btn btn-secondary text-xs py-1.5 px-3 text-slate-300"
            >
              View in Library
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
