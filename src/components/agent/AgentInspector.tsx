import React from 'react'
import { Bot, CheckCircle, XCircle, Clock, Trash2, Terminal } from 'lucide-react'
import { useAgentStore } from '../../stores/agent-store'

export const AgentInspector: React.FC = () => {
  const { logs, clearLogs } = useAgentStore()

  const registeredTools = [
    { name: 'get_project_state', readOnly: true, desc: 'Inspect current project snapshot' },
    { name: 'transcribe_audio_asset', readOnly: false, desc: 'Run Whisper STT on asset' },
    { name: 'generate_voiceover', readOnly: false, desc: 'Generate TTS voiceover' },
    { name: 'generate_music', readOnly: false, desc: 'Generate backing track music' },
    { name: 'update_audio_track', readOnly: false, desc: 'Update clip position & track gain' },
    { name: 'mix_audio_project', readOnly: false, desc: 'Update ducking & mix levels' },
    { name: 'export_audio', readOnly: false, desc: 'Render master mixdown WAV' },
  ]

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto font-sans">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              WebMCP Inspector
            </h2>
            <p className="text-xs text-slate-400">AI Agent Tools & Logs</p>
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

      {/* Registered Tools List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">Registered Tools (7)</span>
          <span className="badge badge-cyan text-[10px]">document.modelContext</span>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          {registeredTools.map((t) => (
            <div
              key={t.name}
              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-950/60 border border-slate-800/60"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <code className="font-mono text-cyan-300 font-semibold">{t.name}</code>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                  t.readOnly
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                    : 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {t.readOnly ? 'read-only' : 'mutating'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Call Log */}
      <div className="mt-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Tool Call Logs
          </span>
          <span className="text-[11px] font-mono text-slate-400">{logs.length} calls</span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs bg-slate-900/20 rounded-lg border border-slate-800/30">
            No agent tool invocations yet. Connect a WebMCP-compatible browser agent or execute commands.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col gap-2 font-mono text-xs shadow-sm"
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
                <span className="text-slate-500 block mb-1">Input:</span>
                <pre>{JSON.stringify(log.input, null, 2)}</pre>
              </div>

              {/* Output / Error */}
              {log.output && (
                <div className="bg-slate-900 p-2 rounded text-[11px] text-emerald-300 overflow-x-auto">
                  <span className="text-slate-500 block mb-1">Output:</span>
                  <pre>{JSON.stringify(log.output, null, 2)}</pre>
                </div>
              )}
              {log.error && (
                <div className="bg-rose-950/40 border border-rose-800/60 p-2 rounded text-[11px] text-rose-300">
                  <span className="text-rose-400 font-bold block mb-1">Error:</span>
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
