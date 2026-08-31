import type { Project, TrackType } from '../../contracts/project'
import { getDecodedAudioBuffer } from '../audio-buffer-pool'
import { audioBufferToWav } from './wav-exporter'

export interface AudioExportOptions {
  scope: 'all' | 'voiceover' | 'music'
  format?: 'wav' | 'mp3'
}

/**
 * Render multi-track audio to AudioBuffer filtered by scope (all, voiceover, music)
 */
export async function renderTrackScopeToAudioBuffer(
  project: Project,
  scope: 'all' | 'voiceover' | 'music',
  sampleRate = 44100,
): Promise<AudioBuffer> {
  const allowedTypes: TrackType[] =
    scope === 'all'
      ? ['voiceover', 'music', 'sfx']
      : scope === 'voiceover'
        ? ['voiceover']
        : ['music']

  const activeTracks = project.tracks.filter(
    (t) => allowedTypes.includes(t.type) && !t.muted,
  )

  let maxClipEnd = 0
  for (const track of activeTracks) {
    for (const clip of track.clips) {
      maxClipEnd = Math.max(maxClipEnd, clip.startSec + clip.durationSec)
    }
  }

  const renderDuration = Math.max(project.durationSec, maxClipEnd, 1.0)
  const lengthInSamples = Math.ceil(renderDuration * sampleRate)

  const offlineCtx = new OfflineAudioContext(2, lengthInSamples, sampleRate)
  const masterGain = offlineCtx.createGain()
  masterGain.gain.setValueAtTime(project.masterGain, 0)
  masterGain.connect(offlineCtx.destination)

  // Collect speech intervals for sidechain ducking if scope is all
  const voiceIntervals: { start: number; end: number }[] = []
  if (scope === 'all' && project.ducking?.enabled) {
    for (const track of project.tracks) {
      if (track.type === 'voiceover' && !track.muted) {
        for (const clip of track.clips) {
          voiceIntervals.push({
            start: clip.startSec,
            end: clip.startSec + clip.durationSec,
          })
        }
      }
    }
  }

  for (const track of activeTracks) {
    const trackGain = offlineCtx.createGain()
    trackGain.gain.setValueAtTime(track.gain, 0)

    // Sidechain ducking on music
    if (
      scope === 'all' &&
      track.type === 'music' &&
      project.ducking?.enabled &&
      voiceIntervals.length > 0
    ) {
      const duckGainLinear = Math.pow(10, project.ducking.duckingAmountDb / 20)
      const attack = project.ducking.attackSec || 0.05
      const release = project.ducking.releaseSec || 0.3

      voiceIntervals.sort((a, b) => a.start - b.start)

      for (const interval of voiceIntervals) {
        const duckStart = Math.max(0, interval.start)
        const duckEnd = interval.end

        trackGain.gain.setValueAtTime(track.gain, Math.max(0, duckStart - attack))
        trackGain.gain.linearRampToValueAtTime(track.gain * duckGainLinear, duckStart)
        trackGain.gain.setValueAtTime(track.gain * duckGainLinear, duckEnd)
        trackGain.gain.linearRampToValueAtTime(track.gain, duckEnd + release)
      }
    }

    trackGain.connect(masterGain)

    for (const clip of track.clips) {
      try {
        const audioBuffer = await getDecodedAudioBuffer(clip.assetId)
        const source = offlineCtx.createBufferSource()
        source.buffer = audioBuffer

        const clipGain = offlineCtx.createGain()
        clipGain.gain.setValueAtTime(clip.gain ?? 1.0, 0)

        source.connect(clipGain)
        clipGain.connect(trackGain)

        const bufferOffset = clip.offsetSec || 0
        const playDuration = Math.min(clip.durationSec, audioBuffer.duration - bufferOffset)

        if (playDuration > 0) {
          source.start(clip.startSec, bufferOffset, playDuration)
        }
      } catch (err) {
        console.warn(`Could not render clip ${clip.name} during audio export:`, err)
      }
    }
  }

  return await offlineCtx.startRendering()
}

/**
 * Export scoped audio to WAV Blob
 */
export async function exportScopedAudioWav(
  project: Project,
  scope: 'all' | 'voiceover' | 'music',
): Promise<Blob> {
  const rendered = await renderTrackScopeToAudioBuffer(project, scope, project.sampleRate || 44100)
  return audioBufferToWav(rendered, project.sampleRate || 44100)
}
