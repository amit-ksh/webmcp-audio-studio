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
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: 'var(--muted-foreground)' }}>
          Audio Tracks
        </h3>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenVoiceoverModal}
            className="btn btn-secondary text-xs py-1 px-2.5"
            style={{ color: 'var(--track-voice)' }}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>+ Add voiceover</span>
          </button>

          <button
            type="button"
            onClick={onOpenMusicModal}
            className="btn btn-secondary text-xs py-1 px-2.5"
            style={{ color: 'var(--track-music)' }}
          >
            <Music className="w-3.5 h-3.5" />
            <span>+ Add background music</span>
          </button>
        </div>
      </div>

      {/* Track Control Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Voiceover Track Controls */}
        {voiceTrack && (
          <div
            className="p-3 rounded-md flex flex-col justify-between gap-2.5"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Mic className="w-4 h-4" style={{ color: 'var(--track-voice)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                  🎙 Voiceover
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
                  ({voiceTrack.clips.length} {voiceTrack.clips.length === 1 ? 'clip' : 'clips'})
                </span>
              </div>

              {voiceTrack.clips.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearTrackClips(voiceTrack.id)}
                  className="btn btn-ghost text-xs p-1 hover:text-red-400"
                  title="Delete voiceover audio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Controls: Volume, Mute */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400" style={{ color: 'var(--muted-foreground)' }}>
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
                className={`btn text-xs px-2 py-0.5 font-mono ${
                  voiceTrack.muted ? 'btn-danger' : 'btn-ghost'
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
            className="p-3 rounded-md flex flex-col justify-between gap-2.5"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Music className="w-4 h-4" style={{ color: 'var(--track-music)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                  ♪ Background Music
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
                  ({musicTrack.clips.length} {musicTrack.clips.length === 1 ? 'clip' : 'clips'})
                </span>
              </div>

              {musicTrack.clips.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearTrackClips(musicTrack.id)}
                  className="btn btn-ghost text-xs p-1 hover:text-red-400"
                  title="Delete background music"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Controls: Volume, Mute */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400" style={{ color: 'var(--muted-foreground)' }}>
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
                className={`btn text-xs px-2 py-0.5 font-mono ${
                  musicTrack.muted ? 'btn-danger' : 'btn-ghost'
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
