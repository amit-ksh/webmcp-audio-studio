import React, { useState } from 'react'
import { Sparkles, Play, Copy, ArrowRight, Check, XCircle, Cpu } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { usePlaybackStore } from '../../stores/playback-store'
import { transcriptionService } from './transcription-service'
import { audioEngine } from '../../audio/engine'
import { formatTime } from '../../lib/utils'
import type { TranscriptSegment } from '../../contracts/project'

export const TranscriptionPanel: React.FC = () => {
  const { assets } = useProjectStore()
  const { setSidebarTab } = usePlaybackStore()
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '')
  const [language, setLanguage] = useState('en')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [activeDevice, setActiveDevice] = useState<string>('auto')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAsset = assets.find((a) => a.id === selectedAssetId)

  const handleTranscribe = async () => {
    if (!selectedAsset) return
    setIsTranscribing(true)
    setError(null)
    setProgress(5)
    setStatusMessage('Initializing Whisper speech model...')

    try {
      await transcriptionService.transcribeAsset(
        selectedAsset.id,
        language,
        ({ progress: prog, message, device }) => {
          setProgress(prog)
          setStatusMessage(message)
          if (device) setActiveDevice(device)
        },
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleCancel = () => {
    transcriptionService.cancel()
    setIsTranscribing(false)
    setStatusMessage('Transcription cancelled')
  }

  const handleCopyText = () => {
    if (!selectedAsset?.transcript?.text) return
    navigator.clipboard.writeText(selectedAsset.transcript.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePlaySegment = async (seg: TranscriptSegment) => {
    if (!selectedAsset) return
    const project = useProjectStore.getState().currentProject
    if (project) {
      usePlaybackStore.getState().setCurrentTime(seg.start)
      audioEngine.seek(seg.start, project)
    }
  }

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Speech-to-Text
            </h2>
            <p className="text-xs text-slate-400">Whisper AI in Web Worker</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono text-emerald-400">
          <Cpu className="w-3 h-3" />
          <span>{activeDevice.toUpperCase()}</span>
        </div>
      </div>

      {/* Asset Selector */}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs font-semibold text-slate-300">Select Audio Asset</label>
        <select
          value={selectedAssetId}
          onChange={(e) => setSelectedAssetId(e.target.value)}
          className="select text-xs"
          disabled={isTranscribing}
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
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="select text-xs"
          disabled={isTranscribing}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={handleTranscribe}
          disabled={!selectedAsset || isTranscribing}
          className="btn btn-primary flex-1 text-xs py-2 bg-emerald-600 hover:bg-emerald-500"
        >
          <Sparkles className="w-4 h-4" />
          {isTranscribing ? 'Transcribing with Whisper...' : 'Transcribe Audio'}
        </button>

        {isTranscribing && (
          <button
            onClick={handleCancel}
            className="btn btn-danger text-xs py-2 px-3"
            title="Cancel inference"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress & Status Message */}
      {isTranscribing && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-lg p-3 mt-3 flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between text-xs font-medium text-emerald-400">
            <span>{statusMessage}</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-3 mt-3 flex items-start gap-2 text-rose-300 text-xs">
          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Transcription Error</p>
            <p className="mt-0.5 text-rose-300/80">{error}</p>
          </div>
        </div>
      )}

      {/* Transcripts Display */}
      <div className="mt-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Timestamped Segments
          </h3>
          {selectedAsset?.transcript && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyText}
                className="btn btn-secondary text-[11px] py-0.5 px-2 text-slate-300"
                title="Copy Full Transcript"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {selectedAsset?.transcript ? (
          <div className="flex flex-col gap-2">
            {/* Full text summary */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-relaxed shadow-inner">
              {selectedAsset.transcript.text}
            </div>

            {/* Segments breakdown */}
            <div className="flex flex-col gap-1.5 mt-1">
              {selectedAsset.transcript.segments.map((seg) => (
                <div
                  key={seg.id}
                  onClick={() => handlePlaySegment(seg)}
                  className="bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 rounded-md p-2 flex items-start justify-between gap-2 cursor-pointer transition-all hover:bg-slate-900 group"
                  title="Click to seek playhead to this timestamp"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 flex-shrink-0 mt-0.5">
                      {formatTime(seg.start)}
                    </span>
                    <p className="text-xs text-slate-300 group-hover:text-white leading-tight">
                      {seg.text}
                    </p>
                  </div>
                  <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>

            <button
              onClick={() => setSidebarTab('voiceover')}
              className="btn btn-secondary mt-2 text-xs py-1.5 text-violet-300 hover:text-white"
            >
              Use text in Voiceover Studio <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs bg-slate-900/30 rounded-lg border border-slate-800/40">
            Select an audio asset and click transcribe to extract timestamped dialogue using in-browser Whisper.
          </div>
        )}
      </div>
    </div>
  )
}
