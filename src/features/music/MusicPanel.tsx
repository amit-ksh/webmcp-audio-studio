import React, { useState } from 'react'
import { Music, Sparkles } from 'lucide-react'
import type { MusicMood } from '../../contracts/audio'

export const MusicPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('Energetic SaaS product launch with modern synth pulse')
  const [mood, setMood] = useState<MusicMood>('energetic_tech')
  const [durationSec, setDurationSec] = useState(25)
  const [bpm, setBpm] = useState(124)
  const [isGenerating] = useState(false)

  const moods: { id: MusicMood; label: string; desc: string }[] = [
    { id: 'energetic_tech', label: 'Energetic Tech', desc: 'Upbeat arpeggios, punchy synth drums' },
    { id: 'cinematic_reveal', label: 'Cinematic Reveal', desc: 'Epic swells, deep sub bass, tension' },
    { id: 'ambient_minimal', label: 'Ambient Minimal', desc: 'Warm lush pads, subtle pulse' },
    { id: 'upbeat_fun', label: 'Upbeat & Fun', desc: 'Bright chords, groovy bass, playful groove' },
  ]

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
          <Music className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Backing Track Music
          </h2>
          <p className="text-xs text-slate-400">AI Procedural Synthesizer</p>
        </div>
      </div>

      {/* Prompt */}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs font-semibold text-slate-300">Music Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the mood, instruments, rhythm..."
          className="textarea text-xs h-20"
        />
      </div>

      {/* Mood Presets */}
      <div className="flex flex-col gap-2 mt-3">
        <label className="text-xs font-semibold text-slate-300">Mood Preset</label>
        <div className="grid grid-cols-2 gap-2">
          {moods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={`p-2 rounded-lg border text-left transition-all ${
                mood === m.id
                  ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <p className="text-xs font-semibold">{m.label}</p>
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Duration & BPM */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Duration</span>
            <span className="font-mono text-cyan-400">{durationSec}s</span>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={durationSec}
            onChange={(e) => setDurationSec(parseInt(e.target.value))}
            className="accent-cyan-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Tempo (BPM)</span>
            <span className="font-mono text-cyan-400">{bpm}</span>
          </div>
          <input
            type="range"
            min="70"
            max="160"
            step="2"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="accent-cyan-500"
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        disabled={!prompt.trim() || isGenerating}
        className="btn btn-primary mt-4 w-full text-xs py-2 bg-cyan-600 hover:bg-cyan-500"
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating ? 'Generating Audio Track...' : 'Generate Backing Track'}
      </button>
    </div>
  )
}
