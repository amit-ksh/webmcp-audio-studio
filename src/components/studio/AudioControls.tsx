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
    <div className="flex flex-col gap-3 w-full">
      {/* Quick Action Button Bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--muted-foreground)' }}>
          Audio Tracks & Mix
        </h3>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenVoiceoverModal}
            className="btn btn-secondary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-sm"
            style={{
              borderColor: 'rgba(168, 85, 247, 0.3)',
              color: 'var(--track-voice)',
            }}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>+ Add voiceover</span>
          </button>

          <button
            type="button"
            onClick={onOpenMusicModal}
            className="btn btn-secondary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-sm"
            style={{
              borderColor: 'rgba(6, 182, 212, 0.3)',
              color: 'var(--track-music)',
            }}
          >
            <Music className="w-3.5 h-3.5" />
            <span>+ Add background music</span>
          </button>
        </div>
      </div>

      {/* Track Control Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Voiceover Track Controls */}
        {voiceTrack && (
          <div
            className="studio-card p-3.5 rounded-xl flex flex-col justify-between gap-3"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                  Voiceover
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">
                  {voiceTrack.clips.length} {voiceTrack.clips.length === 1 ? 'clip' : 'clips'}
                </span>
              </div>

              {voiceTrack.clips.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearTrackClips(voiceTrack.id)}
                  className="btn btn-ghost text-xs p-1 hover:text-red-400"
                  title="Clear all voice clips"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Volume slider & mute */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
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
                <span className="text-[10px] font-mono w-9 text-right" style={{ color: 'var(--muted-foreground)' }}>
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
                {voiceTrack.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{voiceTrack.muted ? 'Muted' : 'Mute'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Background Music Track Controls */}
        {musicTrack && (
          <div
            className="studio-card p-3.5 rounded-xl flex flex-col justify-between gap-3"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <Music className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                  Background Music
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                  {musicTrack.clips.length} {musicTrack.clips.length === 1 ? 'clip' : 'clips'}
                </span>
              </div>

              {musicTrack.clips.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearTrackClips(musicTrack.id)}
                  className="btn btn-ghost text-xs p-1 hover:text-red-400"
                  title="Clear all music clips"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Volume slider & mute */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
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
                <span className="text-[10px] font-mono w-9 text-right" style={{ color: 'var(--muted-foreground)' }}>
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
                {musicTrack.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{musicTrack.muted ? 'Muted' : 'Mute'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
