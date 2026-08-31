import React from 'react'
import { Mic, Music, Volume2, VolumeX, Trash2 } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { formatDb } from '../../lib/utils'

interface AudioControlsProps {
  onOpenVoiceoverModal: () => void
  onOpenMusicModal: () => void
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  onOpenVoiceoverModal,
  onOpenMusicModal,
}) => {
  const {
    currentProject,
    setTrackGain,
    toggleTrackMute,
    removeClip,
  } = useProjectStore()

  if (!currentProject) return null

  const voiceTrack = currentProject.tracks.find((t) => t.type === 'voiceover')
  const musicTrack = currentProject.tracks.find((t) => t.type === 'music')

  const handleClearTrackClips = (trackId: string) => {
    const track = currentProject.tracks.find((t) => t.id === trackId)
    if (track && track.clips.length > 0) {
      if (window.confirm(`Clear all audio clips on "${track.name}"?`)) {
        for (const c of track.clips) {
          removeClip(c.id)
        }
      }
    }
  }

  return (
    <div className="flex flex-col w-full border-t border-slate-200 bg-white">
      {/* Audio Deck Header & Quick Actions */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800">
          Audio Tracks & Mix
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenVoiceoverModal}
            className="btn text-xs py-1.5 px-3 rounded-lg shadow-2xs font-semibold flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300"
          >
            <Mic className="w-3.5 h-3.5 text-purple-600" />
            <span>+ Add voiceover</span>
          </button>

          <button
            type="button"
            onClick={onOpenMusicModal}
            className="btn text-xs py-1.5 px-3 rounded-lg shadow-2xs font-semibold flex items-center gap-1.5 bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300"
          >
            <Music className="w-3.5 h-3.5 text-cyan-600" />
            <span>+ Add background music</span>
          </button>
        </div>
      </div>

      {/* Connected Track Control Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-white">
        {/* Voiceover Track Controls */}
        {voiceTrack && (
          <div className="p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900">
                  Voiceover
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                  {voiceTrack.clips.length} {voiceTrack.clips.length === 1 ? 'clip' : 'clips'}
                </span>
              </div>

              {voiceTrack.clips.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearTrackClips(voiceTrack.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Clear all voice clips"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Volume slider & mute */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[11px] font-mono font-medium text-slate-500">
                  Vol
                </span>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={voiceTrack.gain}
                  onChange={(e) => setTrackGain(voiceTrack.id, parseFloat(e.target.value))}
                  className="flex-1 cursor-pointer"
                  title={`Track Gain: ${formatDb(voiceTrack.gain)}`}
                />
                <span className="text-[10px] font-mono font-semibold text-slate-600 w-9 text-right">
                  {formatDb(voiceTrack.gain)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleTrackMute(voiceTrack.id)}
                className={`btn text-xs px-2.5 py-1 font-mono rounded-lg ${
                  voiceTrack.muted ? 'btn-danger' : 'btn-secondary'
                }`}
                title={voiceTrack.muted ? 'Unmute' : 'Mute'}
              >
                {voiceTrack.muted ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{voiceTrack.muted ? 'Muted' : 'Mute'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Background Music Track Controls */}
        {musicTrack && (
          <div className="p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-700">
                  <Music className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900">
                  Background Music
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium">
                  {musicTrack.clips.length} {musicTrack.clips.length === 1 ? 'clip' : 'clips'}
                </span>
              </div>

              {musicTrack.clips.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearTrackClips(musicTrack.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Clear all music clips"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Volume slider & mute */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[11px] font-mono font-medium text-slate-500">
                  Vol
                </span>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={musicTrack.gain}
                  onChange={(e) => setTrackGain(musicTrack.id, parseFloat(e.target.value))}
                  className="flex-1 cursor-pointer"
                  title={`Track Gain: ${formatDb(musicTrack.gain)}`}
                />
                <span className="text-[10px] font-mono font-semibold text-slate-600 w-9 text-right">
                  {formatDb(musicTrack.gain)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleTrackMute(musicTrack.id)}
                className={`btn text-xs px-2.5 py-1 font-mono rounded-lg ${
                  musicTrack.muted ? 'btn-danger' : 'btn-secondary'
                }`}
                title={musicTrack.muted ? 'Unmute' : 'Mute'}
              >
                {musicTrack.muted ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{musicTrack.muted ? 'Muted' : 'Mute'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
