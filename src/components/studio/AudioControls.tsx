import React, { useState } from 'react'
import { Mic, Music, Volume2, VolumeX, Trash2, RefreshCw } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { formatDb } from '../../lib/utils'
import { VoiceoverPanel } from '../../features/voiceover/VoiceoverPanel'
import { MusicPanel } from '../../features/music/MusicPanel'
import type { Clip, TrackType } from '../../contracts/project'
import { audioEngine } from '../../audio/engine'

interface ClipGainRowsProps {
  clips: Clip[]
  trackType: Extract<TrackType, 'voiceover' | 'music'>
  onGainChange: (clipId: string, gain: number) => void
  onReplace: (clipId: string) => void
}

const ClipGainRows: React.FC<ClipGainRowsProps> = ({
  clips,
  trackType,
  onGainChange,
  onReplace,
}) => {
  const isVoiceover = trackType === 'voiceover'
  const accentClass = isVoiceover ? 'accent-purple-600' : 'accent-cyan-600'
  const replaceClass = isVoiceover
    ? 'text-purple-600 hover:border-purple-200 hover:bg-purple-50'
    : 'text-cyan-600 hover:border-cyan-200 hover:bg-cyan-50'
  const label = isVoiceover ? 'Voice' : 'BGM'

  return (
    <div className="flex max-h-32 flex-col gap-1.5 overflow-y-auto border-t border-slate-100 pt-2.5">
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        Clip volumes
      </span>
      {clips.map((clip, index) => (
        <div
          key={clip.id}
          className="grid grid-cols-[minmax(0,1fr)_minmax(84px,1.15fr)_42px] items-center gap-2 rounded-md bg-slate-50/80 px-2 py-1.5"
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[10px] font-medium text-slate-600" title={clip.name}>
              {label} {index + 1}
            </span>
            <button
              type="button"
              onClick={() => onReplace(clip.id)}
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-md border border-transparent transition-colors ${replaceClass}`}
              aria-label={`Replace ${label} ${index + 1}`}
              title={`Replace ${clip.name}`}
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={clip.gain}
            onChange={(event) => onGainChange(clip.id, parseFloat(event.target.value))}
            className={`w-full cursor-pointer ${accentClass}`}
            aria-label={`${label} ${index + 1} volume`}
            title={`${clip.name}: ${clip.gain.toFixed(2)}x`}
          />
          <span className="text-right font-mono text-[10px] font-semibold text-slate-700">
            {clip.gain.toFixed(2)}x
          </span>
        </div>
      ))}
    </div>
  )
}

export const AudioControls: React.FC = () => {
  const [audioAction, setAudioAction] = useState<{
    type: 'voiceover' | 'music'
    mode: 'add' | 'replace'
    targetClipId?: string
  } | null>(null)
  const { currentProject, setTrackGain, toggleTrackMute, removeClip, updateClip } =
    useProjectStore()

  if (!currentProject) return null

  const voiceTrack = currentProject.tracks.find((t) => t.type === 'voiceover')
  const musicTrack = currentProject.tracks.find((t) => t.type === 'music')

  const handleClearTrackClips = (trackId: string) => {
    const track = currentProject.tracks.find((t) => t.id === trackId)
    if (track && track.clips.length > 0) {
      if (window.confirm(`Clear all clips on "${track.name}"?`)) {
        for (const c of track.clips) {
          removeClip(c.id)
        }
      }
    }
  }

  const toggleAddPopover = (type: 'voiceover' | 'music') => {
    setAudioAction((current) =>
      current?.type === type && current.mode === 'add' ? null : { type, mode: 'add' },
    )
  }

  const handleClipGainChange = (clipId: string, gain: number, trackGain: number) => {
    updateClip(clipId, { gain })
    audioEngine.setClipGain(clipId, gain, trackGain)
  }

  return (
    <div className="flex flex-col w-full border-t border-slate-200 bg-white">
      {/* Audio Mixer Header & Secondary Add Actions */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-b border-slate-200">
        <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-700">
          Audio Mixer
        </span>

        {/* Secondary Add Audio Actions */}
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleAddPopover('voiceover')}
            className={`btn btn-secondary text-xs py-1.5 px-3 rounded-md text-purple-700 hover:text-purple-800 border-purple-200 hover:bg-purple-50 flex items-center gap-1.5 font-medium ${audioAction?.type === 'voiceover' ? 'bg-purple-50' : ''}`}
            aria-expanded={audioAction?.type === 'voiceover'}
            aria-haspopup="dialog"
          >
            <Mic className="w-3 h-3 text-purple-600" />
            <span>Voiceover</span>
          </button>

          <button
            type="button"
            onClick={() => toggleAddPopover('music')}
            className={`btn btn-secondary text-xs py-1.5 px-3 rounded-md text-cyan-700 hover:text-cyan-800 border-cyan-200 hover:bg-cyan-50 flex items-center gap-1.5 font-medium ${audioAction?.type === 'music' ? 'bg-cyan-50' : ''}`}
            aria-expanded={audioAction?.type === 'music'}
            aria-haspopup="dialog"
          >
            <Music className="w-3 h-3 text-cyan-600" />
            <span>Background music</span>
          </button>

          <VoiceoverPanel
            isOpen={audioAction?.type === 'voiceover'}
            mode={audioAction?.mode ?? 'add'}
            targetClipId={audioAction?.targetClipId}
            onClose={() => setAudioAction(null)}
          />
          <MusicPanel
            isOpen={audioAction?.type === 'music'}
            mode={audioAction?.mode ?? 'add'}
            targetClipId={audioAction?.targetClipId}
            onClose={() => setAudioAction(null)}
          />
        </div>
      </div>

      {/* Balanced Audio Track Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-white">
        {/* Voiceover Card */}
        {voiceTrack && (
          <div className="flex flex-col gap-3.5 p-4">
            {/* Card Header: Icon, Name, Clip Count, Clear */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Voiceover</span>
                <span className="text-[10px] leading-none font-mono font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-500">
                  {voiceTrack.clips.length} {voiceTrack.clips.length === 1 ? 'clip' : 'clips'}
                </span>
              </div>

              {voiceTrack.clips.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearTrackClips(voiceTrack.id)}
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Clear all voice clips"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {voiceTrack.clips.length > 0 && (
              <ClipGainRows
                clips={voiceTrack.clips}
                trackType="voiceover"
                onGainChange={(clipId, gain) => handleClipGainChange(clipId, gain, voiceTrack.gain)}
                onReplace={(clipId) =>
                  setAudioAction({ type: 'voiceover', mode: 'replace', targetClipId: clipId })
                }
              />
            )}

            {/* Volume Control, dB Readout, Mute Button */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <div className="flex-1 flex items-center gap-2">
                <span
                  className="text-[10px] font-mono text-slate-400"
                  title="Overall volume for every voiceover clip"
                >
                  Master
                </span>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={voiceTrack.gain}
                  onChange={(e) => setTrackGain(voiceTrack.id, parseFloat(e.target.value))}
                  className="flex-1 cursor-pointer"
                  aria-label="Voiceover master volume"
                  title={`Gain: ${formatDb(voiceTrack.gain)}`}
                />
                <span className="w-12 whitespace-nowrap text-right font-mono text-[10px] font-semibold text-slate-600">
                  {formatDb(voiceTrack.gain)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleTrackMute(voiceTrack.id)}
                className={`btn text-[11px] py-1 px-2 rounded font-medium ${
                  voiceTrack.muted
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                    : 'btn-secondary text-slate-600 hover:text-slate-900'
                }`}
                title={voiceTrack.muted ? 'Unmute voiceover' : 'Mute voiceover'}
              >
                {voiceTrack.muted ? (
                  <VolumeX className="w-3 h-3 text-red-600" />
                ) : (
                  <Volume2 className="w-3 h-3 text-slate-500" />
                )}
                <span>{voiceTrack.muted ? 'Muted' : 'Mute'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Background Music Card */}
        {musicTrack && (
          <div className="flex flex-col gap-3.5 p-4">
            {/* Card Header: Icon, Name, Clip Count, Clear */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-cyan-50 text-cyan-600 border border-cyan-200 flex items-center justify-center">
                  <Music className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Background Music</span>
                <span className="text-[10px] leading-none font-mono font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-500">
                  {musicTrack.clips.length} {musicTrack.clips.length === 1 ? 'clip' : 'clips'}
                </span>
              </div>

              {musicTrack.clips.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearTrackClips(musicTrack.id)}
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Clear all music clips"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {musicTrack.clips.length > 0 && (
              <ClipGainRows
                clips={musicTrack.clips}
                trackType="music"
                onGainChange={(clipId, gain) => handleClipGainChange(clipId, gain, musicTrack.gain)}
                onReplace={(clipId) =>
                  setAudioAction({ type: 'music', mode: 'replace', targetClipId: clipId })
                }
              />
            )}

            {musicTrack.clips.length > 0 && (
              /* Volume controls are only useful once the track has audio. */
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <div className="flex-1 flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono text-slate-400"
                    title="Overall volume for every background music clip"
                  >
                    Master
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={musicTrack.gain}
                    onChange={(e) => setTrackGain(musicTrack.id, parseFloat(e.target.value))}
                    className="flex-1 cursor-pointer"
                    aria-label="Background music master volume"
                    title={`Gain: ${formatDb(musicTrack.gain)}`}
                  />
                  <span className="w-12 whitespace-nowrap text-right font-mono text-[10px] font-semibold text-slate-600">
                    {formatDb(musicTrack.gain)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleTrackMute(musicTrack.id)}
                  className={`btn text-[11px] py-1 px-2 rounded font-medium ${
                    musicTrack.muted
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'btn-secondary text-slate-600 hover:text-slate-900'
                  }`}
                  title={musicTrack.muted ? 'Unmute music' : 'Mute music'}
                >
                  {musicTrack.muted ? (
                    <VolumeX className="w-3 h-3 text-red-600" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-slate-500" />
                  )}
                  <span>{musicTrack.muted ? 'Muted' : 'Mute'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
