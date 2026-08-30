import { commandBus } from './bus'
import { useProjectStore } from '../stores/project-store'
import { useAgentStore } from '../stores/agent-store'
import { dbToLinear } from '../lib/utils'
import type { WebMCPToolResult } from './types'

export async function executeWebMCPTool(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<WebMCPToolResult> {
  const agentStore = useAgentStore.getState()
  const logId = agentStore.addLog(toolName, args)

  try {
    let result: WebMCPToolResult

    switch (toolName) {
      case 'get_project_state': {
        const store = useProjectStore.getState()
        const project = store.currentProject
        if (!project) {
          result = { success: false, error: 'No active project found' }
        } else {
          result = {
            success: true,
            message: `Current project: "${project.name}" (${project.tracks.length} tracks, ${project.durationSec}s)`,
            data: {
              projectId: project.id,
              name: project.name,
              durationSec: project.durationSec,
              sampleRate: project.sampleRate,
              masterGain: project.masterGain,
              ducking: project.ducking,
              tracks: project.tracks.map((t) => ({
                id: t.id,
                name: t.name,
                type: t.type,
                gain: t.gain,
                muted: t.muted,
                solo: t.solo,
                clipCount: t.clips.length,
                clips: t.clips.map((c) => ({
                  id: c.id,
                  name: c.name,
                  startSec: c.startSec,
                  durationSec: c.durationSec,
                  gain: c.gain,
                })),
              })),
              assets: store.assets.map((a) => ({
                id: a.id,
                name: a.name,
                type: a.type,
                durationSec: a.durationSec,
                sampleRate: a.sampleRate,
                hasTranscript: Boolean(a.transcript),
              })),
            },
          }
        }
        break
      }

      case 'transcribe_audio_asset': {
        const assetId = String(args.assetId || '')
        const language = String(args.language || 'en')
        if (!assetId) {
          result = { success: false, error: 'Parameter "assetId" is required' }
          break
        }
        const cmdRes = await commandBus.execute({
          type: 'transcription.run',
          payload: { assetId, language },
        })
        result = {
          success: cmdRes.success,
          message: cmdRes.message,
          data: cmdRes.data,
          error: cmdRes.error,
        }
        break
      }

      case 'generate_voiceover': {
        const text = String(args.text || '')
        if (!text.trim()) {
          result = { success: false, error: 'Parameter "text" is required' }
          break
        }
        const voiceId = args.voiceId ? String(args.voiceId) : 'narrator_male'
        const speed = typeof args.speed === 'number' ? args.speed : 1.0
        const pitch = typeof args.pitch === 'number' ? args.pitch : 1.0
        const autoInsertToTimeline =
          typeof args.autoInsertToTimeline === 'boolean' ? args.autoInsertToTimeline : true

        const cmdRes = await commandBus.execute({
          type: 'voiceover.generate',
          payload: { text, voiceId, speed, pitch, autoInsertToTimeline },
        })
        result = {
          success: cmdRes.success,
          message: cmdRes.message,
          data: cmdRes.data,
          error: cmdRes.error,
        }
        break
      }

      case 'generate_music': {
        const prompt = String(args.prompt || '')
        if (!prompt.trim()) {
          result = { success: false, error: 'Parameter "prompt" is required' }
          break
        }
        const mood = (args.mood as 'energetic_tech' | 'cinematic_reveal' | 'ambient_minimal' | 'upbeat_fun') || 'energetic_tech'
        const durationSec = typeof args.durationSec === 'number' ? args.durationSec : 30
        const bpm = typeof args.bpm === 'number' ? args.bpm : 120
        const autoInsertToTimeline =
          typeof args.autoInsertToTimeline === 'boolean' ? args.autoInsertToTimeline : true

        const cmdRes = await commandBus.execute({
          type: 'music.generate',
          payload: { prompt, mood, durationSec, bpm, autoInsertToTimeline },
        })
        result = {
          success: cmdRes.success,
          message: cmdRes.message,
          data: cmdRes.data,
          error: cmdRes.error,
        }
        break
      }

      case 'update_audio_track': {
        const { clipId, trackId, startSec, gainDb, muted, solo } = args as {
          clipId?: string
          trackId?: string
          startSec?: number
          gainDb?: number
          muted?: boolean
          solo?: boolean
        }

        if (clipId) {
          const patch: Record<string, unknown> = {}
          if (startSec !== undefined) patch.startSec = startSec
          if (gainDb !== undefined) patch.gain = dbToLinear(gainDb)
          const cmdRes = await commandBus.execute({
            type: 'timeline.updateClip',
            payload: { clipId, patch },
          })
          result = {
            success: cmdRes.success,
            message: cmdRes.message,
            data: cmdRes.data,
            error: cmdRes.error,
          }
        } else if (trackId) {
          const trackGain = gainDb !== undefined ? dbToLinear(gainDb) : undefined
          const cmdRes = await commandBus.execute({
            type: 'timeline.updateTrack',
            payload: { trackId, gain: trackGain, muted, solo },
          })
          result = {
            success: cmdRes.success,
            message: cmdRes.message,
            data: cmdRes.data,
            error: cmdRes.error,
          }
        } else {
          result = { success: false, error: 'Either "clipId" or "trackId" is required' }
        }
        break
      }

      case 'mix_audio_project': {
        const duckingAmountDb =
          typeof args.duckingAmountDb === 'number' ? args.duckingAmountDb : undefined
        const masterGain = typeof args.masterGain === 'number' ? args.masterGain : undefined

        const cmdRes = await commandBus.execute({
          type: 'project.mix',
          payload: { duckingAmountDb, masterGain },
        })
        result = {
          success: cmdRes.success,
          message: cmdRes.message,
          data: cmdRes.data,
          error: cmdRes.error,
        }
        break
      }

      case 'export_audio': {
        const cmdRes = await commandBus.execute({
          type: 'project.export',
          payload: { format: 'wav' },
        })
        result = {
          success: cmdRes.success,
          message: cmdRes.message,
          data: cmdRes.data
            ? {
                format: 'wav',
                sizeBytes: (cmdRes.data as { sizeBytes: number }).sizeBytes,
                durationSec: (cmdRes.data as { durationSec: number }).durationSec,
              }
            : undefined,
          error: cmdRes.error,
        }
        break
      }

      default:
        result = { success: false, error: `Unknown tool: ${toolName}` }
    }

    if (result.success) {
      agentStore.updateLogSuccess(logId, (result.data as Record<string, unknown>) || { status: 'ok' })
    } else {
      agentStore.updateLogFailure(logId, result.error || 'Failed')
    }

    return result
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    agentStore.updateLogFailure(logId, errorMsg)
    return { success: false, error: errorMsg }
  }
}
