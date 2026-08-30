import { useProjectStore } from '../stores/project-store'
import { saveAsset, deleteAsset } from '../storage/indexed-db'
import { audioEngine } from '../audio/engine'
import { getAudioContext } from '../audio/audio-context'
import { cacheAudioBuffer, removeAudioBufferFromCache } from '../audio/audio-buffer-pool'
import type { AudioAsset, DuckingConfig, Clip } from '../contracts/project'
import type { CommandResult } from '../contracts/audio'
import { generateId, formatTime } from '../lib/utils'

export type StudioCommand =
  | { type: 'project.create'; payload: { name?: string } }
  | { type: 'project.load'; payload: { id: string } }
  | { type: 'project.delete'; payload: { id: string } }
  | { type: 'project.rename'; payload: { name: string } }
  | { type: 'asset.import'; payload: { file: File } }
  | { type: 'asset.delete'; payload: { assetId: string } }
  | {
      type: 'timeline.addClip'
      payload: {
        trackId: string
        assetId: string
        name?: string
        startSec?: number
        gain?: number
      }
    }
  | {
      type: 'timeline.updateClip'
      payload: {
        clipId: string
        patch: Partial<Clip>
      }
    }
  | { type: 'timeline.removeClip'; payload: { clipId: string } }
  | {
      type: 'timeline.updateTrack'
      payload: {
        trackId: string
        gain?: number
        muted?: boolean
        solo?: boolean
      }
    }
  | { type: 'mixer.setDucking'; payload: Partial<DuckingConfig> }
  | { type: 'project.mix'; payload: { duckingAmountDb?: number; masterGain?: number } }
  | { type: 'project.export'; payload: { format?: 'wav' } }
  | { type: 'transcription.run'; payload: { assetId: string; language?: string } }
  | {
      type: 'voiceover.generate'
      payload: {
        text: string
        voiceId?: string
        speed?: number
        pitch?: number
        autoInsertToTimeline?: boolean
      }
    }
  | {
      type: 'music.generate'
      payload: {
        prompt: string
        mood?: 'energetic_tech' | 'cinematic_reveal' | 'ambient_minimal' | 'upbeat_fun'
        durationSec?: number
        bpm?: number
        autoInsertToTimeline?: boolean
      }
    }

class CommandBus {
  public async execute(command: StudioCommand): Promise<CommandResult> {
    const store = useProjectStore.getState()

    try {
      switch (command.type) {
        case 'project.create': {
          const project = await store.createNewProject(command.payload.name)
          return { success: true, message: `Created project ${project.name}`, data: project }
        }

        case 'project.load': {
          await store.loadProject(command.payload.id)
          return { success: true, message: `Loaded project ${command.payload.id}` }
        }

        case 'project.delete': {
          await store.deleteProject(command.payload.id)
          return { success: true, message: `Deleted project ${command.payload.id}` }
        }

        case 'project.rename': {
          store.updateProjectMeta({ name: command.payload.name })
          return { success: true, message: `Renamed project to ${command.payload.name}` }
        }

        case 'asset.import': {
          const file = command.payload.file
          const arrayBuffer = await file.arrayBuffer()
          const ctx = getAudioContext()
          const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0))

          const assetId = generateId('asset_import')
          const assetMeta: AudioAsset = {
            id: assetId,
            name: file.name.replace(/\.[^/.]+$/, ''),
            type: 'import',
            mimeType: file.type || 'audio/wav',
            durationSec: decoded.duration,
            sampleRate: decoded.sampleRate,
            channels: decoded.numberOfChannels,
            sizeBytes: file.size,
            createdAt: Date.now(),
          }

          cacheAudioBuffer(assetId, decoded)
          await saveAsset(assetMeta, file)
          store.addAsset(assetMeta)

          return {
            success: true,
            message: `Imported audio asset ${assetMeta.name}`,
            data: assetMeta,
          }
        }

        case 'asset.delete': {
          const { assetId } = command.payload
          await deleteAsset(assetId)
          removeAudioBufferFromCache(assetId)
          store.removeAsset(assetId)
          return { success: true, message: `Deleted asset ${assetId}` }
        }

        case 'timeline.addClip': {
          const { trackId, assetId, name, startSec = 0, gain = 1.0 } = command.payload
          const asset = store.assets.find((a) => a.id === assetId)
          if (!asset) {
            return { success: false, error: `Audio asset not found: ${assetId}` }
          }

          const clip = store.addClipToTrack(trackId, {
            assetId,
            name: name || asset.name,
            startSec,
            durationSec: asset.durationSec,
            offsetSec: 0,
            gain,
            fadeInSec: 0,
            fadeOutSec: 0,
          })

          return { success: true, message: `Added clip to track`, data: clip }
        }

        case 'timeline.updateClip': {
          const { clipId, patch } = command.payload
          store.updateClip(clipId, patch)
          return { success: true, message: `Updated clip ${clipId}` }
        }

        case 'timeline.removeClip': {
          const { clipId } = command.payload
          store.removeClip(clipId)
          return { success: true, message: `Removed clip ${clipId}` }
        }

        case 'timeline.updateTrack': {
          const { trackId, gain, muted, solo } = command.payload
          if (gain !== undefined) store.setTrackGain(trackId, gain)
          if (muted !== undefined) {
            const current = store.currentProject?.tracks.find((t) => t.id === trackId)
            if (current && current.muted !== muted) store.toggleTrackMute(trackId)
          }
          if (solo !== undefined) {
            const current = store.currentProject?.tracks.find((t) => t.id === trackId)
            if (current && current.solo !== solo) store.toggleTrackSolo(trackId)
          }
          return { success: true, message: `Updated track ${trackId}` }
        }

        case 'mixer.setDucking': {
          store.setDuckingConfig(command.payload)
          return { success: true, message: `Updated ducking settings` }
        }

        case 'project.mix': {
          if (command.payload.duckingAmountDb !== undefined) {
            store.setDuckingConfig({ duckingAmountDb: command.payload.duckingAmountDb })
          }
          if (command.payload.masterGain !== undefined) {
            store.setMasterGain(command.payload.masterGain)
          }
          return { success: true, message: `Updated project mix settings` }
        }

        case 'project.export': {
          const project = store.currentProject
          if (!project) {
            return { success: false, error: 'No active project to export' }
          }
          const blob = await audioEngine.exportProjectWav(project)
          return {
            success: true,
            message: `Rendered project WAV (${(blob.size / 1024 / 1024).toFixed(2)} MB)`,
            data: { blob, sizeBytes: blob.size, durationSec: project.durationSec },
          }
        }

        case 'transcription.run': {
          const { assetId, language = 'en' } = command.payload
          const { transcriptionService } = await import(
            '../features/transcription/transcription-service'
          )
          const transcript = await transcriptionService.transcribeAsset(assetId, language)
          return {
            success: true,
            message: `Transcribed audio asset (${transcript.segments.length} segments)`,
            data: transcript,
          }
        }

        case 'voiceover.generate': {
          const {
            text,
            voiceId = 'narrator_male',
            speed = 1.0,
            pitch = 1.0,
            autoInsertToTimeline = true,
          } = command.payload
          const { voiceoverService } = await import('../features/voiceover/voiceover-service')
          const asset = await voiceoverService.generateVoiceover({
            text,
            voiceId,
            speed,
            pitch,
            autoInsertToTimeline,
          })
          return {
            success: true,
            message: `Generated voiceover (${formatTime(asset.durationSec)})`,
            data: asset,
          }
        }

        case 'music.generate': {
          const {
            prompt,
            mood = 'energetic_tech',
            durationSec = 30,
            bpm = 120,
            autoInsertToTimeline = true,
          } = command.payload
          const { musicService } = await import('../features/music/music-service')
          const asset = await musicService.generateMusic({
            prompt,
            mood,
            durationSec,
            bpm,
            autoInsertToTimeline,
          })
          return {
            success: true,
            message: `Generated backing track (${formatTime(asset.durationSec)})`,
            data: asset,
          }
        }

        default: {
          const unknownCmd = command as { type: string }
          return { success: false, error: `Unknown command type: ${unknownCmd.type}` }
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      return { success: false, error: errorMsg }
    }
  }
}

export const commandBus = new CommandBus()
