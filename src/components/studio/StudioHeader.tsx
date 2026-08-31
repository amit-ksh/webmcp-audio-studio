import React from 'react'
import { Sparkles, Plus, Bot, Download } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { useVideoStore } from '../../stores/video-store'
import { useAgentStore } from '../../stores/agent-store'

interface StudioHeaderProps {
  onNewVideo?: () => void
  onOpenExport?: () => void
  hasVideo?: boolean
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  onNewVideo,
  onOpenExport,
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
    <header className="header-bar">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-slate-900">
            Audio Studio
          </span>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
            WebMCP
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {isAgentActive && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-cyan-50 text-cyan-700 border border-cyan-200"
            title="WebMCP agent is connected and monitoring commands"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-600" />
            <span>Agent Active</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleNew}
          className="btn btn-secondary text-xs py-1.5 px-3 rounded-lg shadow-2xs font-medium text-slate-700"
          title="Start fresh project"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          <span>New</span>
        </button>

        {hasVideo && onOpenExport && (
          <button
            type="button"
            onClick={onOpenExport}
            className="btn btn-primary text-xs py-1.5 px-3.5 rounded-lg shadow-sm font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}
      </div>
    </header>
  )
}
