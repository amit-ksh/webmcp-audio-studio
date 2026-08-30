import React, { useState, useEffect } from 'react'
import {
  FolderOpen,
  Plus,
  Download,
  Bot,
  Sliders,
  FileAudio,
  Sparkles,
  Mic,
  Music,
  Activity,
} from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { usePlaybackStore } from '../../stores/playback-store'
import { useAgentStore } from '../../stores/agent-store'
import { PlaybackControls } from './PlaybackControls'
import { AssetPanel } from './AssetPanel'
import { Timeline } from '../timeline/Timeline'
import { downloadBlob } from '../../audio/exporters/wav-exporter'
import { commandBus } from '../../webmcp/bus'

// Placeholder panels for upcoming sprints
import { TranscriptionPanel } from '../../features/transcription/TranscriptionPanel'
import { VoiceoverPanel } from '../../features/voiceover/VoiceoverPanel'
import { MusicPanel } from '../../features/music/MusicPanel'
import { MixerPanel } from '../../features/mixer/MixerPanel'
import { AgentInspector } from '../agent/AgentInspector'

export const StudioShell: React.FC = () => {
  const { currentProject, projectList, initStore, createNewProject, loadProject, updateProjectMeta } =
    useProjectStore()
  const { sidebarTab, setSidebarTab } = usePlaybackStore()
  const isAgentActive = useAgentStore((state) => state.isAgentActive)
  const [isExporting, setIsExporting] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [projectNameInput, setProjectNameInput] = useState('')

  useEffect(() => {
    initStore()
  }, [initStore])

  useEffect(() => {
    if (currentProject) {
      setProjectNameInput(currentProject.name)
    }
  }, [currentProject])

  const handleExportWav = async () => {
    if (!currentProject) return
    setIsExporting(true)
    try {
      const result = await commandBus.execute({
        type: 'project.export',
        payload: { format: 'wav' },
      })
      if (result.success && result.data) {
        const data = result.data as { blob: Blob }
        downloadBlob(data.blob, `${currentProject.name.replace(/\s+/g, '_')}_master.wav`)
      } else {
        alert(result.error || 'Failed to export master audio')
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleSaveProjectName = () => {
    setIsEditingName(false)
    if (projectNameInput.trim()) {
      updateProjectMeta({ name: projectNameInput.trim() })
    }
  }

  return (
    <div className="studio-layout">
      {/* Studio Header */}
      <header className="studio-header">
        <div className="flex items-center gap-3">
          {/* Studio Brand */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                WebMCP <span className="text-cyan-400 font-light">Audio Studio</span>
              </h1>
              <span className="text-[10px] font-mono text-slate-400 block -mt-0.5">
                Browser DAW • Client-First
              </span>
            </div>
          </div>

          {/* Project Switcher & Name */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <select
                value={currentProject?.id || ''}
                onChange={(e) => loadProject(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-md pl-7 pr-3 py-1 outline-none cursor-pointer hover:border-slate-700"
              >
                {projectList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <FolderOpen className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
            </div>

            {isEditingName ? (
              <input
                type="text"
                value={projectNameInput}
                onChange={(e) => setProjectNameInput(e.target.value)}
                onBlur={handleSaveProjectName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveProjectName()}
                autoFocus
                className="bg-slate-950 border border-indigo-500 text-white text-xs px-2 py-0.5 rounded outline-none font-semibold"
              />
            ) : (
              <span
                onClick={() => setIsEditingName(true)}
                className="text-xs font-semibold text-slate-300 hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-slate-800"
                title="Click to rename project"
              >
                {currentProject?.name || 'Untitled Project'} ✏️
              </span>
            )}

            <button
              onClick={() => createNewProject()}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Create New Project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Transport Controls */}
        <PlaybackControls />

        {/* Right Actions: WebMCP Agent indicator & Export Button */}
        <div className="flex items-center gap-2">
          {isAgentActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-full text-cyan-300 text-xs font-medium pulse-active">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Agent Active</span>
            </div>
          )}

          <button
            onClick={() => setSidebarTab('agent')}
            className={`btn ${
              sidebarTab === 'agent'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'btn-secondary text-slate-300'
            } text-xs py-1.5 px-3`}
            title="Open WebMCP Agent Inspector"
          >
            <Bot className="w-3.5 h-3.5" /> Agent Tools
          </button>

          <button
            onClick={handleExportWav}
            disabled={isExporting}
            className="btn btn-primary text-xs py-1.5 px-3"
            title="Export full mixdown as 16-bit WAV"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Rendering WAV...' : 'Export WAV'}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="studio-workspace">
        {/* Left Navigation Sidebar */}
        <aside className="w-16 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-3 gap-2 flex-shrink-0">
          <button
            onClick={() => setSidebarTab('assets')}
            className={`p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 ${
              sidebarTab === 'assets'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Media Assets"
          >
            <FileAudio className="w-5 h-5" />
            <span className="text-[9px] font-medium">Assets</span>
          </button>

          <button
            onClick={() => setSidebarTab('voiceover')}
            className={`p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 ${
              sidebarTab === 'voiceover'
                ? 'bg-violet-600/20 text-violet-400 border border-violet-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="TTS Voiceover Generator"
          >
            <Mic className="w-5 h-5" />
            <span className="text-[9px] font-medium">Voice</span>
          </button>

          <button
            onClick={() => setSidebarTab('music')}
            className={`p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 ${
              sidebarTab === 'music'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="AI Backing Track Music"
          >
            <Music className="w-5 h-5" />
            <span className="text-[9px] font-medium">Music</span>
          </button>

          <button
            onClick={() => setSidebarTab('transcription')}
            className={`p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 ${
              sidebarTab === 'transcription'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Whisper Speech-to-Text"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] font-medium">STT</span>
          </button>

          <button
            onClick={() => setSidebarTab('mixer')}
            className={`p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 ${
              sidebarTab === 'mixer'
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Sidechain Ducking & Mixer"
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[9px] font-medium">Mixer</span>
          </button>

          <div className="w-8 h-[1px] bg-slate-800 my-1" />

          <button
            onClick={() => setSidebarTab('agent')}
            className={`p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 ${
              sidebarTab === 'agent'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/40'
                : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-900'
            }`}
            title="WebMCP Agent Inspector"
          >
            <Bot className="w-5 h-5" />
            <span className="text-[9px] font-medium">Agent</span>
          </button>
        </aside>

        {/* Active Side Panel */}
        <div className="studio-sidebar">
          {sidebarTab === 'assets' && <AssetPanel />}
          {sidebarTab === 'voiceover' && <VoiceoverPanel />}
          {sidebarTab === 'music' && <MusicPanel />}
          {sidebarTab === 'transcription' && <TranscriptionPanel />}
          {sidebarTab === 'mixer' && <MixerPanel />}
          {sidebarTab === 'agent' && <AgentInspector />}
        </div>

        {/* Main Central Studio Timeline */}
        <main className="studio-main">
          <Timeline />
        </main>
      </div>
    </div>
  )
}
