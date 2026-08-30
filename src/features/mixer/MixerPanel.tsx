import React from 'react'
import { Sliders, Volume2, ArrowDownUp } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { formatDb } from '../../lib/utils'

export const MixerPanel: React.FC = () => {
  const { currentProject, setDuckingConfig, setMasterGain } = useProjectStore()

  if (!currentProject) return null

  const ducking = currentProject.ducking || {
    enabled: true,
    duckingAmountDb: -14,
    attackSec: 0.05,
    releaseSec: 0.3,
    thresholdDb: -30,
  }

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Mixer & Ducking
          </h2>
          <p className="text-xs text-slate-400">Automatic voiceover sidechain</p>
        </div>
      </div>

      {/* Sidechain Ducking Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-3 mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownUp className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">Auto Music Ducking</span>
          </div>
          <input
            type="checkbox"
            checked={ducking.enabled}
            onChange={(e) => setDuckingConfig({ enabled: e.target.checked })}
            className="w-4 h-4 accent-amber-500 cursor-pointer"
          />
        </div>

        <p className="text-[11px] text-slate-400">
          Automatically reduces backing music volume whenever voiceover or speech clips are active on the timeline.
        </p>

        {/* Ducking Amount */}
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Ducking Gain Reduction</span>
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
              <span>Attack</span>
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
              <span>Release</span>
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

      {/* Master Bus Gain */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-3 mt-4">
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
