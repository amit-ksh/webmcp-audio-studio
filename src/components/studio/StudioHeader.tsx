import React from 'react'
import { Plus, Download, Bot, Terminal } from 'lucide-react'
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
    <header className="flex items-center justify-between py-3.5 mb-4 border-b border-slate-200/80">
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-2.5">
        <div>
          <span
            className="text-xl font-extrabold tracking-[-0.04em] leading-none text-slate-900"
            style={{ fontFamily: '"Segoe UI Variable Display", "Avenir Next", "Trebuchet MS", sans-serif' }}
          >
            Waveframe
          </span>
        </div>

        {isAgentActive && (
          <div
            className="flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
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
          className="btn btn-secondary text-xs py-2 px-3 rounded-md text-slate-700 hover:text-blue-600 hover:border-blue-300 flex items-center gap-1.5"
          title="Inspect available WebMCP agent tools and schemas"
        >
          <Terminal className="w-3.5 h-3.5 text-blue-600" />
          <span>WebMCP Tools</span>
        </button>

        <button
          type="button"
          onClick={handleNew}
          className="btn btn-secondary text-xs py-2 px-3 rounded-md text-slate-700"
          title="Start fresh project"
        >
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>New</span>
        </button>

        {hasVideo && onOpenExport && (
          <button
            type="button"
            onClick={onOpenExport}
            className="btn btn-primary text-xs py-2 px-3.5 rounded-md font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}
      </div>
    </header>
  )
}
