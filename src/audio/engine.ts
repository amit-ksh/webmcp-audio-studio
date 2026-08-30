import { getAudioContext, ensureAudioContextRunning } from './audio-context'
import { getDecodedAudioBuffer } from './audio-buffer-pool'
import type { Project, Clip } from '../contracts/project'
import { audioBufferToWav } from './exporters/wav-exporter'

interface ActiveSource {
  source: AudioBufferSourceNode
  gainNode: GainNode
  clip: Clip
}

class AudioEngine {
  private masterGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private activeSources: ActiveSource[] = []
  private isPlaying = false
  private startTime = 0
  private pauseOffset = 0
  private animFrameId: number | null = null
  private currentProject: Project | null = null
  private onTimeUpdateCallback: ((time: number) => void) | null = null
  private onEndedCallback: (() => void) | null = null

  private initMasterChain(ctx: AudioContext): { masterGain: GainNode; analyser: AnalyserNode } {
    if (!this.masterGain || !this.analyser) {
      this.masterGain = ctx.createGain()
      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8
      this.masterGain.connect(this.analyser)
      this.analyser.connect(ctx.destination)
    }
    return { masterGain: this.masterGain, analyser: this.analyser }
  }

  public getAnalyser(): AnalyserNode | null {
    if (!this.analyser && typeof window !== 'undefined') {
      const ctx = getAudioContext()
      this.initMasterChain(ctx)
    }
    return this.analyser
  }

  public setMasterGain(linearValue: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(linearValue, getAudioContext().currentTime)
    }
  }

  public setTimeUpdateListener(cb: (time: number) => void): void {
    this.onTimeUpdateCallback = cb
  }

  public setEndedListener(cb: () => void): void {
    this.onEndedCallback = cb
  }

  public async play(project: Project, startOffset?: number): Promise<void> {
    const ctx = await ensureAudioContextRunning()
    const { masterGain } = this.initMasterChain(ctx)

    if (this.isPlaying) {
      this.stopSources()
    }

    this.currentProject = project
    const offset = startOffset !== undefined ? startOffset : this.pauseOffset
    this.startTime = ctx.currentTime - offset
    this.isPlaying = true
    masterGain.gain.setValueAtTime(project.masterGain, ctx.currentTime)

    // Preload audio buffers and schedule clips
    const allClips: { clip: Clip; trackMuted: boolean; trackGain: number; trackType: string }[] = []
    for (const track of project.tracks) {
      if (track.muted) continue
      for (const clip of track.clips) {
        allClips.push({
          clip,
          trackMuted: track.muted,
          trackGain: track.gain,
          trackType: track.type,
        })
      }
    }

    const now = ctx.currentTime

    for (const item of allClips) {
      const { clip, trackGain } = item
      const clipStart = clip.startSec
      const clipEnd = clip.startSec + clip.durationSec

      // If playhead has passed this clip, skip it
      if (offset >= clipEnd) continue

      try {
        const audioBuffer = await getDecodedAudioBuffer(clip.assetId)
        if (!this.isPlaying) return // stopped during async decode

        const source = ctx.createBufferSource()
        source.buffer = audioBuffer

        const clipGain = ctx.createGain()
        const effectiveGain = (clip.gain ?? 1.0) * trackGain
        clipGain.gain.setValueAtTime(effectiveGain, now)

        source.connect(clipGain)
        clipGain.connect(masterGain)

        // Calculate schedule timing
        let whenToPlay: number
        let bufferOffset: number
        let playDuration: number

        if (offset <= clipStart) {
          // Play in the future
          whenToPlay = now + (clipStart - offset)
          bufferOffset = clip.offsetSec || 0
          playDuration = Math.min(clip.durationSec, audioBuffer.duration - bufferOffset)
        } else {
          // Play immediately from middle of clip
          whenToPlay = now
          const elapsedInClip = offset - clipStart
          bufferOffset = (clip.offsetSec || 0) + elapsedInClip
          playDuration = Math.max(0, clip.durationSec - elapsedInClip)
        }

        if (playDuration > 0 && bufferOffset < audioBuffer.duration) {
          source.start(whenToPlay, bufferOffset, playDuration)
          this.activeSources.push({ source, gainNode: clipGain, clip })
        }
      } catch (err) {
        console.warn(`Failed to play clip ${clip.name}:`, err)
      }
    }

    this.startTrackingLoop(ctx, project.durationSec)
  }

  public pause(): number {
    if (!this.isPlaying) return this.pauseOffset
    const ctx = getAudioContext()
    const currentPlayhead = ctx.currentTime - this.startTime
    this.pauseOffset = Math.max(0, currentPlayhead)
    this.stopSources()
    this.isPlaying = false
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
    return this.pauseOffset
  }

  public stop(): void {
    this.stopSources()
    this.isPlaying = false
    this.pauseOffset = 0
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(0)
    }
  }

  public seek(seconds: number, project?: Project): void {
    const wasPlaying = this.isPlaying
    this.pauseOffset = Math.max(0, seconds)
    if (wasPlaying && (project || this.currentProject)) {
      this.play(project || this.currentProject!, this.pauseOffset)
    } else {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.pauseOffset)
      }
    }
  }

  private stopSources(): void {
    for (const item of this.activeSources) {
      try {
        item.source.stop()
        item.source.disconnect()
        item.gainNode.disconnect()
      } catch {
        // Already stopped/disconnected
      }
    }
    this.activeSources = []
  }

  private startTrackingLoop(ctx: AudioContext, projectDuration: number): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
    }

    const tick = () => {
      if (!this.isPlaying) return
      const current = ctx.currentTime - this.startTime
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(current)
      }

      if (current >= projectDuration) {
        this.stop()
        if (this.onEndedCallback) {
          this.onEndedCallback()
        }
        return
      }

      this.animFrameId = requestAnimationFrame(tick)
    }

    this.animFrameId = requestAnimationFrame(tick)
  }

  /**
   * Offline Multi-Track Mix Render
   */
  public async renderProjectToAudioBuffer(
    project: Project,
    sampleRate = 44100,
  ): Promise<AudioBuffer> {
    // Calculate total duration from clips
    let maxClipEnd = 0
    for (const track of project.tracks) {
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

    // Collect speech intervals for ducking
    const voiceIntervals: { start: number; end: number }[] = []
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

    for (const track of project.tracks) {
      if (track.muted) continue

      const trackGain = offlineCtx.createGain()
      trackGain.gain.setValueAtTime(track.gain, 0)

      // Apply sidechain ducking curve to music tracks if ducking is enabled
      if (track.type === 'music' && project.ducking?.enabled && voiceIntervals.length > 0) {
        const duckGainLinear = Math.pow(10, project.ducking.duckingAmountDb / 20)
        const attack = project.ducking.attackSec || 0.05
        const release = project.ducking.releaseSec || 0.3

        // Sort intervals
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
          console.warn(`Could not render clip ${clip.name} during export:`, err)
        }
      }
    }

    const renderedBuffer = await offlineCtx.startRendering()
    return renderedBuffer
  }

  public async exportProjectWav(project: Project): Promise<Blob> {
    const rendered = await this.renderProjectToAudioBuffer(project, project.sampleRate || 44100)
    return audioBufferToWav(rendered, project.sampleRate || 44100)
  }
}

export const audioEngine = new AudioEngine()
