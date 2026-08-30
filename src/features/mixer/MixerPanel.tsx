import React from 'react'
import { Sliders, Volume2, ArrowDownUp, Mic, Music, Radio, VolumeX } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { formatDb } from '../../lib/utils'
import type { TrackType } from '../../contracts/project'

export const MixerPanel: React.FC = () => {
  const {
    currentProject,
    setDuckingConfig,
    setMasterGain,
    setTrackGain,
    toggleTrackMute,
    toggleTrackSolo,
  } = useProjectStore()

  if (!currentProject) return null

  const ducking = currentProject.ducking || {
    enabled: true,
    duckingAmountDb: -14,
    attackSec: 0.05,
    releaseSec: 0.3,
    thresholdDb: -30,
  }

  const getTrackIcon = (type: TrackType) => {
    switch (type) {
      case 'voiceover':
        return <Mic className="w-3.5 h-3.5 text-violet-400" />
      case 'music':
        return <Music className="w-3.5 h-3.5 text-cyan-400" />
      default:
        return <Radio className="w-3.5 h-3.5 text-amber-400" />
    }
  }

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto font-sans">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400 shadow-sm">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Mixer & Ducking
          </h2>
          <p className="text-xs text-slate-400">Sidechain DSP & Channel Strips</p>
        </div>
      </div>

      {/* Sidechain Ducking DSP Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-3 mt-1 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownUp className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">Automatic Music Ducking</span>
          </div>
          <input
            type="checkbox"
            checked={ducking.enabled}
            onChange={(e) => setDuckingConfig({ enabled: e.target.checked })}
            className="w-4 h-4 accent-amber-500 cursor-pointer"
          />
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Dynamic sidechain compressor that attenuates backing music during speech clips and smoothly recovers during pauses.
        </p>

        {/* Visual Ducking Curve Preview */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Voice Activity: [SPEECH]</span>
            <span className="text-amber-400 font-bold">Music Gain: {ducking.duckingAmountDb}dB</span>
          </div>

          <svg viewBox="0 0 300 40" className="w-full h-10 overflow-visible">
            {/* Base nominal music line */}
            <line x1="0" y1="8" x2="300" y2="8" stroke="#334155" strokeDasharray="3,3" strokeWidth="1" />
            {/* Voiceover block representation */}
            <rect x="70" y="2" width="160" height="8" rx="2" fill="#8b5cf6" opacity="0.4" />
            <text x="150" y="8" fill="#e2e8f0" fontSize="7" textAnchor="middle" fontFamily="monospace">
              VOICEOVER ACTIVE
            </text>
            {/* Ducking attenuation curve */}
            <path
              d="M 0,10 L 60,10 Q 70,32 80,32 L 220,32 Q 230,32 250,10 L 300,10"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        {/* Ducking Amount */}
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Attenuation Depth</span>
            <span className="font-mono text-amber-400 font-bold">{ducking.duckingAmountDb} dB</span>
          </div>
          <input
            type="range"
            min="-30"
            max="-3"
            step="1"
            value={ducking.duckingAmountDb}
            onChange={(e) => setDuckingConfig({ duckingAmountDb: parseInt(e.target.value) })}
            className="accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Attack & Release */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Attack (Fade In)</span>
              <span className="font-mono text-slate-400">{(ducking.attackSec * 1000).toFixed(0)}ms</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.2"
              step="0.01"
              value={ducking.attackSec}
              onChange={(e) => setDuckingConfig({ attackSec: parseFloat(e.target.value) })}
              className="accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Release (Recovery)</span>
              <span className="font-mono text-slate-400">{(ducking.releaseSec * 1000).toFixed(0)}ms</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={ducking.releaseSec}
              onChange={(e) => setDuckingConfig({ releaseSec: parseFloat(e.target.value) })}
              className="accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Channel Strips */}
      <div className="mt-4 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Track Channel Strips
        </h3>

        <div className="flex flex-col gap-2">
          {currentProject.tracks.map((track) => (
            <div
              key={track.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-2 w-28 overflow-hidden">
                {getTrackIcon(track.type)}
                <span className="text-xs font-semibold text-slate-200 truncate" title={track.name}>
                  {track.name}
                </span>
              </div>

              {/* Fader */}
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={track.gain}
                  onChange={(e) => setTrackGain(track.id, parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
                  {formatDb(track.gain)}
                </span>
              </div>

              {/* Mute / Solo */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleTrackMute(track.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                    track.muted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {track.muted ? <VolumeX className="w-3 h-3" /> : 'M'}
                </button>
                <button
                  onClick={() => toggleTrackSolo(track.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                    track.solo ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  S
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Master Bus Gain */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-3 mt-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-200">Master Output Bus</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Master Volume</span>
            <span className="font-mono text-indigo-400 font-bold">{formatDb(currentProject.masterGain)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={currentProject.masterGain}
            onChange={(e) => setMasterGain(parseFloat(e.target.value))}
            className="accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
