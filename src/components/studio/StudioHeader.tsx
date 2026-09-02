import React, { useState, useEffect } from 'react'
import { Plus, Download, Bot, Terminal } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { useVideoStore } from '../../stores/video-store'
import { useAgentStore } from '../../stores/agent-store'
import { AppLogo } from '../brand/Logo'
import type { BrandFontFamily } from '../brand/Logo'
import { BrandShowcaseModal } from '../brand/BrandShowcaseModal'

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

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  const [currentFont, setCurrentFont] = useState<BrandFontFamily>('jakarta')
  const [appName, setAppName] = useState('Waveframe')

  // Load saved preferences if available
  useEffect(() => {
    try {
      const savedFont = localStorage.getItem('brand_font') as BrandFontFamily
      if (savedFont) setCurrentFont(savedFont)
      const savedName = localStorage.getItem('brand_name')
      if (savedName) setAppName(savedName)
    } catch {
      // Ignore local storage error
    }
  }, [])

  const handleSelectFont = (font: BrandFontFamily) => {
    setCurrentFont(font)
    try {
      localStorage.setItem('brand_font', font)
    } catch {
      // Ignore
    }
  }

  const handleSelectName = (name: string) => {
    setAppName(name)
    try {
      localStorage.setItem('brand_name', name)
    } catch {
      // Ignore
    }
  }

  const handleNew = async () => {
    if (window.confirm('Start a new project? Current timeline and video will be cleared.')) {
      await selectVideo(null)
      await createNewProject('New Studio Project')
      onNewVideo?.()
    }
  }

  return (
    <>
      <header className="flex items-center justify-between py-3.5 mb-4 border-b border-slate-200/80">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsBrandModalOpen(true)}
            className="flex items-center gap-2 p-1 -m-1 rounded-lg hover:bg-slate-100/80 transition-colors text-left group"
            title="Click to customize logo, font family, or export SVG"
          >
            <AppLogo
              name={appName}
              fontFamily={currentFont}
              theme="dark"
              size="md"
              animated
            />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 font-medium">
              Brand / SVG
            </span>
          </button>

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

      {/* Brand & SVG Customizer Modal */}
      <BrandShowcaseModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        currentFont={currentFont}
        onSelectFont={handleSelectFont}
        currentName={appName}
        onSelectName={handleSelectName}
      />
    </>
  )
}

