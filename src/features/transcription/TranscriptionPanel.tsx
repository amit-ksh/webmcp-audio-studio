import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { formatTime } from '../../lib/utils'

export const TranscriptionPanel: React.FC = () => {
  const { assets } = useProjectStore()
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '')
  const [isTranscribing] = useState(false)

  const selectedAsset = assets.find((a) => a.id === selectedAssetId)

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Speech-to-Text
          </h2>
          <p className="text-xs text-slate-400">Whisper AI in Web Worker</p>
        </div>
      </div>

      {/* Asset Selector */}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs font-semibold text-slate-300">Select Audio Asset</label>
        <select
          value={selectedAssetId}
          onChange={(e) => setSelectedAssetId(e.target.value)}
          className="select text-xs"
        >
          {assets.length === 0 && <option value="">No audio assets available</option>}
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name} ({formatTime(asset.durationSec)})
            </option>
          ))}
        </select>
      </div>

      {/* Language Selector */}
      <div className="flex flex-col gap-1.5 mt-3">
        <label className="text-xs font-semibold text-slate-300">Language</label>
        <select className="select text-xs" defaultValue="en">
          <option value="en">English (auto-detect)</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="ja">Japanese</option>
        </select>
      </div>

      {/* Action Button */}
      <button
        disabled={!selectedAsset || isTranscribing}
        className="btn btn-primary mt-4 w-full text-xs py-2 bg-emerald-600 hover:bg-emerald-500"
      >
        <Sparkles className="w-4 h-4" />
        {isTranscribing ? 'Transcribing with Whisper...' : 'Transcribe Audio'}
      </button>

      {/* Transcripts Display */}
      <div className="mt-5 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Transcription Output
        </h3>
        {selectedAsset?.transcript ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200">
            <p className="leading-relaxed">{selectedAsset.transcript.text}</p>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs bg-slate-900/30 rounded-lg border border-slate-800/40">
            Select an imported voice asset and click transcribe to generate timestamped text.
          </div>
        )}
      </div>
    </div>
  )
}
