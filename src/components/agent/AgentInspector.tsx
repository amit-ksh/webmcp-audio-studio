import React, { useState, useEffect } from 'react'
import {
  Bot,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Zap,
  Code2,
  Sparkles,
  Film,
} from 'lucide-react'
import { useAgentStore } from '../../stores/agent-store'
import { useVideoStore } from '../../stores/video-store'
import { WEBMCP_TOOLS } from '../../webmcp/tool-definitions'
import { executeWebMCPTool } from '../../webmcp/tool-executors'
import { registerWebMCPTools } from '../../webmcp/register-tools'

const DEFAULT_TOOL_ARGS: Record<string, string> = {
  get_project_state: '{}',
  list_video_assets: '{}',
  get_video_metadata: '{\n  "assetId": ""\n}',
  get_video_asset: '{\n  "assetId": ""\n}',
  extract_video_audio: '{\n  "assetId": ""\n}',
  get_video_transcript: '{\n  "assetId": ""\n}',
  get_video_frame: '{\n  "assetId": "",\n  "timeSec": 2.5\n}',
  transcribe_audio_asset: '{\n  "assetId": "",\n  "language": "en"\n}',
  generate_voiceover:
    '{\n  "text": "Welcome to our AI video showcase. In this demo, we analyze product footage, extract its dialogue, and generate a dynamic soundtrack in seconds.",\n  "voiceId": "narrator_male",\n  "speed": 1.0\n}',
  generate_music:
    '{\n  "prompt": "Energetic SaaS product launch soundtrack with synth arps and punchy beat",\n  "mood": "energetic_tech",\n  "durationSec": 25,\n  "bpm": 124\n}',
  update_audio_track: '{\n  "duckingAmountDb": -14\n}',
  mix_audio_project: '{\n  "duckingAmountDb": -14,\n  "masterGain": 1.0\n}',
  export_audio: '{\n  "format": "wav"\n}',
}

export const AgentInspector: React.FC = () => {
  const { logs, clearLogs } = useAgentStore()
  const videos = useVideoStore((s) => s.videos)
  const [selectedTool, setSelectedTool] = useState(WEBMCP_TOOLS[0].name)
  const [jsonInput, setJsonInput] = useState(DEFAULT_TOOL_ARGS[WEBMCP_TOOLS[0].name])
  const [isExecuting, setIsExecuting] = useState(false)
  const [isRunningDemo, setIsRunningDemo] = useState(false)
  const [isRunningVideoDemo, setIsRunningVideoDemo] = useState(false)
  const [demoStep, setDemoStep] = useState<string>('')
  const [videoDemoStep, setVideoDemoStep] = useState<string>('')

  useEffect(() => {
    registerWebMCPTools()
  }, [])

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName)
    let defaultArg = DEFAULT_TOOL_ARGS[toolName] || '{}'

    // If video tool selected and video exists, pre-fill assetId
    if (
      (toolName.startsWith('get_video') || toolName === 'extract_video_audio') &&
      videos.length > 0
    ) {
      try {
        const parsed = JSON.parse(defaultArg)
        parsed.assetId = videos[0].id
        defaultArg = JSON.stringify(parsed, null, 2)
      } catch {
        // keep default
      }
    }

    setJsonInput(defaultArg)
  }

  const handleExecute = async () => {
    setIsExecuting(true)
    try {
      const parsedArgs = JSON.parse(jsonInput)
      await executeWebMCPTool(selectedTool, parsedArgs)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Invalid JSON or Execution Error: ${msg}`)
    } finally {
      setIsExecuting(false)
    }
  }

  // Standard Voiceover & Music AI Agent Demo Workflow
  const handleRunFullDemoSequence = async () => {
    setIsRunningDemo(true)

    try {
      setDemoStep('1/4: Inspecting project state...')
      await executeWebMCPTool('get_project_state', {})
      await new Promise((r) => setTimeout(r, 600))

      setDemoStep('2/4: Generating Voiceover narration...')
      await executeWebMCPTool('generate_voiceover', {
        text: 'Introducing WebMCP Audio Studio. Create studio-quality voiceover, dynamic backing music, and automatic ducking in seconds.',
        voiceId: 'narrator_male',
        speed: 1.0,
      })
      await new Promise((r) => setTimeout(r, 600))

      setDemoStep('3/4: Generating Backing Music track...')
      await executeWebMCPTool('generate_music', {
        prompt: 'Energetic modern tech launch anthem',
        mood: 'energetic_tech',
        durationSec: 25,
        bpm: 124,
      })
      await new Promise((r) => setTimeout(r, 600))

      setDemoStep('4/4: Configuring Sidechain Ducking & Exporting...')
      await executeWebMCPTool('mix_audio_project', {
        duckingAmountDb: -14,
        masterGain: 1.0,
      })
      await executeWebMCPTool('export_audio', { format: 'wav' })

      setDemoStep('Demo workflow completed!')
    } catch (err) {
      console.error('Agent demo flow failed:', err)
      setDemoStep('Demo sequence failed')
    } finally {
      setIsRunningDemo(false)
    }
  }

  // End-to-End Video AI Narration & Scoring Agent Workflow
  const handleRunVideoAgentDemo = async () => {
    setIsRunningVideoDemo(true)

    try {
      setVideoDemoStep('1/6: Discovering video assets in project...')
      const listRes = await executeWebMCPTool('list_video_assets', {})
      await new Promise((r) => setTimeout(r, 600))

      const videoList =
        (listRes.data as { videos?: Array<{ assetId: string; name: string }> })?.videos || []

      const targetVideoId = videoList.length > 0 ? videoList[0].assetId : ''

      if (targetVideoId) {
        setVideoDemoStep(`2/6: Inspecting metadata for video...`)
        await executeWebMCPTool('get_video_metadata', { assetId: targetVideoId })
        await new Promise((r) => setTimeout(r, 600))

        setVideoDemoStep(`3/6: Extracting audio from video locally...`)
        const extractRes = await executeWebMCPTool('extract_video_audio', {
          assetId: targetVideoId,
        })
        await new Promise((r) => setTimeout(r, 600))

        const audioAssetId = (extractRes.data as { audioAssetId?: string })?.audioAssetId
        if (audioAssetId) {
          setVideoDemoStep(`4/6: Transcribing extracted audio with Whisper STT...`)
          await executeWebMCPTool('transcribe_audio_asset', {
            assetId: audioAssetId,
            language: 'en',
          })
          await new Promise((r) => setTimeout(r, 600))
        }
      } else {
        setVideoDemoStep('2/6: (No video uploaded, using project context)...')
        await executeWebMCPTool('get_project_state', {})
        await new Promise((r) => setTimeout(r, 600))
      }

      setVideoDemoStep('5/6: Synthesizing contextual voiceover & backing track...')
      await executeWebMCPTool('generate_voiceover', {
        text: 'This video showcases our high-velocity product launch. Automated speech extraction, Whisper transcription, and studio-grade mastering are running entirely in your browser.',
        voiceId: 'executive_calm',
        speed: 1.05,
      })
      await new Promise((r) => setTimeout(r, 600))

      await executeWebMCPTool('generate_music', {
        prompt: 'Cinematic tech reveal background music',
        mood: 'cinematic_reveal',
        durationSec: 28,
        bpm: 118,
      })
      await new Promise((r) => setTimeout(r, 600))

      setVideoDemoStep('6/6: Mixing sidechain ducking and rendering WAV master...')
      await executeWebMCPTool('mix_audio_project', {
        duckingAmountDb: -16,
        masterGain: 1.0,
      })
      await executeWebMCPTool('export_audio', { format: 'wav' })

      setVideoDemoStep('Video Agent workflow completed!')
    } catch (err) {
      console.error('Video agent demo failed:', err)
      setVideoDemoStep('Video workflow failed')
    } finally {
      setIsRunningVideoDemo(false)
    }
  }

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto font-sans">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              WebMCP Agent Studio
            </h2>
            <p className="text-xs text-slate-400">Autonomous Browser AI Agent Control</p>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 1-Click AI Demo Workflow Banners */}
      <div className="flex flex-col gap-2.5">
        {/* Video AI Agent Workflow Banner */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-cyan-950/80 to-indigo-950/80 border border-cyan-500/40 rounded-xl p-3 flex flex-col gap-2 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-cyan-300">
              <Film className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold">1-Click Video AI Narration Demo</span>
            </div>
            <span className="badge badge-cyan text-[9px]">Video → Audio → STT → Master</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            Full end-to-end video pipeline: discover video → inspect metadata → extract audio →
            transcribe → synthesize narration → generate music → apply ducking → export master.
          </p>

          <button
            onClick={handleRunVideoAgentDemo}
            disabled={isRunningVideoDemo || isRunningDemo}
            className="btn btn-primary bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-400 hover:to-emerald-500 text-slate-950 text-xs py-1.5 px-3 font-bold shadow-md shadow-cyan-500/25 mt-0.5"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            {isRunningVideoDemo ? videoDemoStep : 'Run Video-to-Narration Agent Flow'}
          </button>
        </div>

        {/* Standard Audio AI Agent Workflow Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold">Standard Narration & Scoring Flow</span>
            </div>
            <span className="badge badge-indigo text-[9px]">Voice + Music</span>
          </div>

          <button
            onClick={handleRunFullDemoSequence}
            disabled={isRunningDemo || isRunningVideoDemo}
            className="btn btn-secondary text-xs py-1.5 px-3 font-medium text-slate-200 hover:text-white"
          >
            <Play className="w-3 h-3 fill-current" />
            {isRunningDemo ? demoStep : 'Run Audio Narration & Music Flow'}
          </button>
        </div>
      </div>

      {/* Interactive Tool Runner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5 mt-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-200">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold">Interactive Tool Runner</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
            {WEBMCP_TOOLS.length} Tools Registered
          </span>
        </div>

        {/* Tool Dropdown */}
        <select
          value={selectedTool}
          onChange={(e) => handleToolSelect(e.target.value)}
          className="select text-xs font-mono"
        >
          {WEBMCP_TOOLS.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name} ({t.readOnlyHint ? 'read-only' : 'mutating'})
            </option>
          ))}
        </select>

        <p className="text-[11px] text-slate-400">
          {WEBMCP_TOOLS.find((t) => t.name === selectedTool)?.description}
        </p>

        {/* JSON Payload Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-slate-400">Arguments (JSON)</label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="textarea text-xs font-mono h-24 bg-slate-950 text-cyan-300"
          />
        </div>

        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className="btn btn-secondary text-xs py-1.5 text-cyan-300 hover:text-white"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isExecuting ? 'Executing Tool...' : `Execute "${selectedTool}"`}
        </button>
      </div>

      {/* Tool Call Logs */}
      <div className="mt-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Agent Call History
          </span>
          <span className="text-[11px] font-mono text-slate-400">{logs.length} calls</span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs bg-slate-900/20 rounded-lg border border-slate-800/30">
            No tool calls logged yet. Run a tool above or trigger actions via WebMCP.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5 font-mono text-xs shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {log.status === 'completed' && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {log.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                  {log.status === 'running' && (
                    <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  )}
                  <span className="text-slate-200 font-bold">{log.toolName}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {log.durationMs ? `${log.durationMs}ms` : 'running...'}
                </span>
              </div>

              {/* Input params */}
              <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-300 overflow-x-auto">
                <span className="text-slate-500 block mb-0.5">Input:</span>
                <pre>{JSON.stringify(log.input, null, 2)}</pre>
              </div>

              {/* Output */}
              {log.output && (
                <div className="bg-slate-900 p-2 rounded text-[11px] text-emerald-300 overflow-x-auto">
                  <span className="text-slate-500 block mb-0.5">Result:</span>
                  <pre>{JSON.stringify(log.output, null, 2)}</pre>
                </div>
              )}
              {log.error && (
                <div className="bg-rose-950/40 border border-rose-800/60 p-2 rounded text-[11px] text-rose-300">
                  <span className="text-rose-400 font-bold block mb-0.5">Error:</span>
                  {log.error}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
