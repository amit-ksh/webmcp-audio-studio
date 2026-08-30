import { commandBus } from './bus'
import { useProjectStore } from '../stores/project-store'
import { useVideoStore } from '../stores/video-store'
import { useAgentStore } from '../stores/agent-store'
import { getVideoAssetMeta, getTranscript } from '../storage/indexed-db'
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
        const videoStore = useVideoStore.getState()
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
              videos: videoStore.videos.map((v) => ({
                id: v.id,
                name: v.name,
                durationSec: v.durationSec,
                width: v.metadata.width,
                height: v.metadata.height,
                hasAudio: v.metadata.hasAudio,
                associatedAudioAssetId: v.associatedAudioAssetId,
              })),
            },
          }
        }
        break
      }

      case 'list_video_assets': {
        const videoStore = useVideoStore.getState()
        const videos = videoStore.videos.map((v) => ({
          assetId: v.id,
          name: v.name,
          durationSec: v.durationSec,
          width: v.metadata.width,
          height: v.metadata.height,
          mimeType: v.mimeType,
          hasAudio: v.metadata.hasAudio,
        }))

        result = {
          success: true,
          message: `Found ${videos.length} video asset(s)`,
          data: { videos },
        }
        break
      }

      case 'get_video_metadata': {
        const assetId = String(args.assetId || '')
        if (!assetId) {
          result = { success: false, error: 'Parameter "assetId" is required' }
          break
        }

        const video =
          useVideoStore.getState().videos.find((v) => v.id === assetId) ||
          (await getVideoAssetMeta(assetId))

        if (!video) {
          result = { success: false, error: `Video asset not found: ${assetId}` }
          break
        }

        result = {
          success: true,
          message: `Metadata for "${video.name}"`,
          data: {
            assetId: video.id,
            name: video.name,
            durationSec: video.durationSec,
            width: video.metadata.width,
            height: video.metadata.height,
            frameRate: video.metadata.frameRate,
            mimeType: video.mimeType,
            sizeBytes: video.sizeBytes,
            hasAudio: video.metadata.hasAudio,
          },
        }
        break
      }

      case 'get_video_asset': {
        const assetId = String(args.assetId || '')
        if (!assetId) {
          result = { success: false, error: 'Parameter "assetId" is required' }
          break
        }

        const video =
          useVideoStore.getState().videos.find((v) => v.id === assetId) ||
          (await getVideoAssetMeta(assetId))

        if (!video) {
          result = { success: false, error: `Video asset not found: ${assetId}` }
          break
        }

        // Return structured local asset reference (never large binary JSON dump)
        result = {
          success: true,
          message: `Resolved video asset "${video.name}"`,
          data: {
            assetId: video.id,
            name: video.name,
            mimeType: video.mimeType,
            sizeBytes: video.sizeBytes,
            durationSec: video.durationSec,
            width: video.metadata.width,
            height: video.metadata.height,
          },
        }
        break
      }

      case 'extract_video_audio': {
        const assetId = String(args.assetId || '')
        if (!assetId) {
          result = { success: false, error: 'Parameter "assetId" is required' }
          break
        }

        const cmdRes = await commandBus.execute({
          type: 'video.extractAudio',
          payload: { videoAssetId: assetId },
        })

        if (!cmdRes.success || !cmdRes.data) {
          result = {
            success: false,
            error: cmdRes.error || 'Failed to extract audio from video',
          }
          break
        }

        const data = cmdRes.data as {
          videoAssetId: string
          audioAssetId: string
          durationSec: number
        }

        result = {
          success: true,
          message: `Successfully extracted audio from video`,
          data: {
            videoAssetId: data.videoAssetId,
            audioAssetId: data.audioAssetId,
            durationSec: data.durationSec,
          },
        }
        break
      }

      case 'get_video_transcript': {
        const assetId = String(args.assetId || '')
        if (!assetId) {
          result = { success: false, error: 'Parameter "assetId" is required' }
          break
        }

        const video =
          useVideoStore.getState().videos.find((v) => v.id === assetId) ||
          (await getVideoAssetMeta(assetId))

        if (!video) {
          result = { success: false, error: `Video asset not found: ${assetId}` }
          break
        }

        // If audio has not been extracted or no transcript is saved yet
        if (!video.associatedAudioAssetId) {
          result = {
            success: false,
            error: 'TRANSCRIPT_NOT_FOUND',
            message:
              'No audio has been extracted from this video yet. Call "extract_video_audio" first, then "transcribe_audio_asset".',
          }
          break
        }

        const transcript = await getTranscript(video.associatedAudioAssetId)
        if (!transcript) {
          result = {
            success: false,
            error: 'TRANSCRIPT_NOT_FOUND',
            message:
              'Audio has been extracted, but transcription has not been run. Call "transcribe_audio_asset" with the audio asset ID.',
            data: { audioAssetId: video.associatedAudioAssetId },
          }
          break
        }

        result = {
          success: true,
          message: `Found transcript with ${transcript.segments.length} segments`,
          data: transcript,
        }
        break
      }

      case 'get_video_frame': {
        const assetId = String(args.assetId || '')
        const timeSec = typeof args.timeSec === 'number' ? args.timeSec : 0

        if (!assetId) {
          result = { success: false, error: 'Parameter "assetId" is required' }
          break
        }

        const cmdRes = await commandBus.execute({
          type: 'video.getFrame',
          payload: { videoAssetId: assetId, timeSec },
        })

        result = {
          success: cmdRes.success,
          message: cmdRes.message,
          data: cmdRes.data,
          error: cmdRes.error,
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
        const mood =
          (args.mood as 'energetic_tech' | 'cinematic_reveal' | 'ambient_minimal' | 'upbeat_fun') ||
          'energetic_tech'
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
      agentStore.updateLogSuccess(
        logId,
        (result.data as Record<string, unknown>) || { status: 'ok' },
      )
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
