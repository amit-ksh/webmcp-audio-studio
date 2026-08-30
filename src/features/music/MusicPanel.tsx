import React, { useState } from 'react'
import { Music, Sparkles, Play, Pause, Check } from 'lucide-react'
import { musicService } from './music-service'
import { usePlaybackStore } from '../../stores/playback-store'
import { getAudioContext } from '../../audio/audio-context'
import { getDecodedAudioBuffer } from '../../audio/audio-buffer-pool'
import { formatTime } from '../../lib/utils'
import type { MusicMood } from '../../contracts/audio'
import type { AudioAsset } from '../../contracts/project'

const PROMPT_SUGGESTIONS = [
  'Modern SaaS launch theme with energetic synth drive',
  'Deep cinematic reveal with sub bass and dramatic builds',
  'Lush ambient background texture for technical walkthrough',
  'Upbeat and groovy soundtrack for marketing promo',
]

const MOODS: { id: MusicMood; label: string; desc: string; bpm: number }[] = [
  {
    id: 'energetic_tech',
    label: 'Energetic Tech',
    desc: 'Driving arpeggios, punchy four-on-the-floor beat, modern synth bass.',
    bpm: 124,
  },
  {
    id: 'cinematic_reveal',
    label: 'Cinematic Reveal',
    desc: 'Deep sub bass swells, tension chords, dramatic boom impacts.',
    bpm: 96,
  },
  {
    id: 'ambient_minimal',
    label: 'Ambient Minimal',
    desc: 'Floating lush stereo pads, gentle rhythmic pulse, subtle texture.',
    bpm: 85,
  },
  {
    id: 'upbeat_fun',
    label: 'Upbeat & Fun',
    desc: 'Bright major chord progression, bouncy bassline, crisp percussion.',
    bpm: 128,
  },
]

export const MusicPanel: React.FC = () => {
  const { setSidebarTab } = usePlaybackStore()
  const [prompt, setPrompt] = useState(PROMPT_SUGGESTIONS[0])
  const [mood, setMood] = useState<MusicMood>('energetic_tech')
  const [durationSec, setDurationSec] = useState(25)
  const [bpm, setBpm] = useState(124)
  const [autoInsert, setAutoInsert] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [lastGeneratedAsset, setLastGeneratedAsset] = useState<AudioAsset | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const handleMoodSelect = (selectedMood: (typeof MOODS)[0]) => {
    setMood(selectedMood.id)
    setBpm(selectedMood.bpm)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setProgress(15)
    setStatusMessage('Composing harmonic structure...')

    try {
      const asset = await musicService.generateMusic(
        {
          prompt: prompt.trim(),
          mood,
          durationSec,
          bpm,
          autoInsertToTimeline: autoInsert,
        },
        ({ progress: prog, message }) => {
          setProgress(prog)
          setStatusMessage(message)
        },
      )
      setLastGeneratedAsset(asset)
    } catch (err) {
      console.error('Failed to generate music:', err)
      alert('Failed to generate backing track')
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
        <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shadow-sm">
          <Music className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Backing Track Studio
          </h2>
          <p className="text-xs text-slate-400">Procedural Stereo Synthesizer</p>
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-col gap-1.5 mt-1">
        <label className="text-[11px] font-semibold text-slate-400">Inspiration Prompts</label>
        <div className="flex flex-col gap-1">
          {PROMPT_SUGGESTIONS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(p)}
              className="text-[10px] text-left bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-2 py-1 rounded transition-colors truncate"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div className="flex flex-col gap-1.5 mt-3">
        <label className="text-xs font-semibold text-slate-300">Prompt Description</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your desired mood, instrumentation, and vibe..."
          className="textarea text-xs h-20"
        />
      </div>

      {/* Mood Presets */}
      <div className="flex flex-col gap-2 mt-3">
        <label className="text-xs font-semibold text-slate-300">Mood Arrangement</label>
        <div className="grid grid-cols-2 gap-2">
          {MOODS.map((m) => (
            <div
              key={m.id}
              onClick={() => handleMoodSelect(m)}
              className={`p-2.5 rounded-lg border cursor-pointer text-left transition-all ${
                mood === m.id
                  ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">{m.label}</p>
                <span className="text-[9px] font-mono text-cyan-400">{m.bpm} BPM</span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Duration & BPM */}
      <div className="grid grid-cols-2 gap-3 mt-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Duration</span>
            <span className="font-mono text-cyan-400 font-bold">{durationSec}s</span>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={durationSec}
            onChange={(e) => setDurationSec(parseInt(e.target.value))}
            className="accent-cyan-500 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Tempo (BPM)</span>
            <span className="font-mono text-cyan-400 font-bold">{bpm}</span>
          </div>
          <input
            type="range"
            min="70"
            max="160"
            step="2"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Auto-Insert Toggle */}
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="text-xs text-slate-300">Auto-add clip to Backing Music Track</span>
        <input
          type="checkbox"
          checked={autoInsert}
          onChange={(e) => setAutoInsert(e.target.checked)}
          className="accent-cyan-500 cursor-pointer w-4 h-4"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        className="btn btn-primary mt-4 w-full text-xs py-2 bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/30"
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating ? 'Synthesizing Backing Track...' : 'Generate Backing Track'}
      </button>

      {/* Progress */}
      {isGenerating && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-lg p-3 mt-3 flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between text-xs font-medium text-cyan-400">
            <span>{statusMessage}</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-indigo-400 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Last Generated Preview Card */}
      {lastGeneratedAsset && (
        <div className="mt-4 bg-slate-900 border border-cyan-500/40 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Track Ready</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">
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
