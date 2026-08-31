import React from 'react'
import { Sparkles, Plus, Download, Bot } from 'lucide-react'
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
    <header className="flex items-center justify-between py-3 mb-3 border-b border-slate-200/80">
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            Audio Studio
          </span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            WebMCP
          </span>
        </div>

        {isAgentActive && (
          <div
            className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
            title="WebMCP agent is connected"
          >
            <Bot className="w-3 h-3 text-emerald-600" />
            <span>Connected</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleNew}
          className="btn btn-secondary text-xs py-1.5 px-3 rounded-md text-slate-700"
          title="Start fresh project"
        >
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>New</span>
        </button>

        {hasVideo && onOpenExport && (
          <button
            type="button"
            onClick={onOpenExport}
            className="btn btn-primary text-xs py-1.5 px-3.5 rounded-md font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}
      </div>
    </header>
  )
}
