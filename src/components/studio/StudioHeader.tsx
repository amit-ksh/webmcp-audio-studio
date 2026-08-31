import React from 'react'
import { Sparkles, Plus, Download, Bot, Terminal } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { useVideoStore } from '../../stores/video-store'
import { useAgentStore } from '../../stores/agent-store'

interface StudioHeaderProps {
  onNewVideo?: () => void
  onOpenExport?: () => void
  onOpenWebMCP?: () => void
  hasVideo?: boolean
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  onNewVideo,
  onOpenExport,
  onOpenWebMCP,
  hasVideo,
}) => {
  const { createNewProject } = useProjectStore()
  const { selectVideo } = useVideoStore()
  const isAgentActive = useAgentStore((state) => state.isAgentActive)

  const handleNew = async () => {
    if (window.confirm('Start a new project? Current timeline and video will be cleared.')) {
      await selectVideo(null)
      await createNewProject('New Studio Project')
      onNewVideo?.()
    }
  }

  return (
    <header className="studio-header flex items-center justify-between border-b border-slate-200/80">
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold tracking-tight text-slate-950">
            Audio Studio
          </span>

          <button
            type="button"
            onClick={onOpenWebMCP}
            className="text-[10px] font-mono font-medium px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
            title="Click to view 13 available WebMCP tools"
          >
            <span>WebMCP</span>
            <span className="text-[9px] bg-blue-200/70 text-blue-800 rounded px-1">13</span>
          </button>
        </div>

        {isAgentActive && (
          <div
            className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
            title="WebMCP agent is connected"
          >
            <Bot className="w-3 h-3 text-emerald-600" />
            <span>Connected</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* WebMCP Tools Action Button */}
        <button
          type="button"
          onClick={onOpenWebMCP}
          className="btn btn-secondary text-xs py-2 px-3 rounded-lg text-slate-700 hover:text-blue-600 hover:border-blue-300 flex items-center gap-1.5"
          title="Inspect available WebMCP agent tools and schemas"
        >
          <Terminal className="w-3.5 h-3.5 text-blue-600" />
          <span>WebMCP Tools</span>
        </button>

        <button
          type="button"
          onClick={handleNew}
          className="btn btn-secondary text-xs py-2 px-3 rounded-lg text-slate-700"
          title="Start fresh project"
        >
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>New</span>
        </button>

        {hasVideo && onOpenExport && (
          <button
            type="button"
            onClick={onOpenExport}
            className="btn btn-primary text-xs py-2 px-3.5 rounded-lg font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}
      </div>
    </header>
  )
}
