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
} from 'lucide-react'
import { useAgentStore } from '../../stores/agent-store'
import { WEBMCP_TOOLS } from '../../webmcp/tool-definitions'
import { executeWebMCPTool } from '../../webmcp/tool-executors'
import { registerWebMCPTools } from '../../webmcp/register-tools'

const DEFAULT_TOOL_ARGS: Record<string, string> = {
  get_project_state: '{}',
  transcribe_audio_asset: '{\n  "assetId": "",\n  "language": "en"\n}',
  generate_voiceover:
    '{\n  "text": "Introducing our AI audio workstation. Built for modern software teams to ship launch videos in minutes.",\n  "voiceId": "narrator_male",\n  "speed": 1.0\n}',
  generate_music:
    '{\n  "prompt": "Energetic SaaS product launch",\n  "mood": "energetic_tech",\n  "durationSec": 25,\n  "bpm": 124\n}',
  update_audio_track: '{\n  "duckingAmountDb": -14\n}',
  mix_audio_project: '{\n  "duckingAmountDb": -14,\n  "masterGain": 1.0\n}',
  export_audio: '{\n  "format": "wav"\n}',
}

export const AgentInspector: React.FC = () => {
  const { logs, clearLogs } = useAgentStore()
  const [selectedTool, setSelectedTool] = useState(WEBMCP_TOOLS[0].name)
  const [jsonInput, setJsonInput] = useState(DEFAULT_TOOL_ARGS[WEBMCP_TOOLS[0].name])
  const [isExecuting, setIsExecuting] = useState(false)
  const [isRunningDemo, setIsRunningDemo] = useState(false)
  const [demoStep, setDemoStep] = useState<string>('')

  useEffect(() => {
    registerWebMCPTools()
  }, [])

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName)
    setJsonInput(DEFAULT_TOOL_ARGS[toolName] || '{}')
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

  // Complete End-to-End AI Agent Demo Workflow
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

      {/* 1-Click AI Demo Workflow Banner */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-indigo-950/80 to-purple-950/80 border border-cyan-500/40 rounded-lg p-3 flex flex-col gap-2 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold">1-Click Autonomous Agent Demo</span>
          </div>
          <span className="badge badge-cyan text-[9px]">WebMCP Hackathon</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-tight">
          Executes the complete end-to-end agent workflow: inspect state → synthesize narration → generate backing music → configure sidechain ducking → export master WAV.
        </p>

        <button
          onClick={handleRunFullDemoSequence}
          disabled={isRunningDemo}
          className="btn btn-primary bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs py-1.5 px-3 font-semibold shadow-md shadow-cyan-500/25 mt-1"
        >
          <Zap className="w-3.5 h-3.5" />
          {isRunningDemo ? demoStep : 'Run Full Agent Demo Sequence'}
        </button>
      </div>

      {/* Interactive Tool Runner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col gap-2.5 mt-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-200">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold">Interactive Tool Runner</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
            7 Tools Registered
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
                  {log.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  {log.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                  {log.status === 'running' && <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
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
