import React, { useState } from 'react'
import { Mic, Sparkles } from 'lucide-react'

export const VoiceoverPanel: React.FC = () => {
  const [scriptText, setScriptText] = useState(
    'Introducing our new AI-powered platform. Create studio-quality audio in seconds.',
  )
  const [voiceId, setVoiceId] = useState('narrator_male')
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(1.0)
  const [isGenerating] = useState(false)

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-violet-950/60 border border-violet-500/30 text-violet-400">
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Voiceover Generator
          </h2>
          <p className="text-xs text-slate-400">Neural TTS in Web Worker</p>
        </div>
      </div>

      {/* Script Text Input */}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs font-semibold text-slate-300">Narration Script</label>
        <textarea
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          placeholder="Enter product pitch, narration, or explainer script..."
          className="textarea text-xs h-28"
        />
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>{scriptText.split(/\s+/).filter(Boolean).length} words</span>
          <span>~{Math.ceil(scriptText.split(/\s+/).filter(Boolean).length / 2.5)}s estimated</span>
        </div>
      </div>

      {/* Voice Selection */}
      <div className="flex flex-col gap-1.5 mt-3">
        <label className="text-xs font-semibold text-slate-300">Voice Persona</label>
        <select
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          className="select text-xs"
        >
          <option value="narrator_male">Tech Narrator (Male - Confident)</option>
          <option value="narrator_female">SaaS Host (Female - Clear & Crisp)</option>
          <option value="energetic_launch">Product Launch (Energetic)</option>
          <option value="executive_calm">Executive Explainer (Calm)</option>
        </select>
      </div>

      {/* Speed & Pitch Controls */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Speed</span>
            <span className="font-mono text-cyan-400">{speed}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.75"
            step="0.05"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="accent-violet-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Pitch</span>
            <span className="font-mono text-violet-400">{pitch}x</span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.25"
            step="0.05"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="accent-violet-500"
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        disabled={!scriptText.trim() || isGenerating}
        className="btn btn-accent mt-4 w-full text-xs py-2"
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating ? 'Synthesizing Voiceover...' : 'Generate Voiceover'}
      </button>
    </div>
  )
}
