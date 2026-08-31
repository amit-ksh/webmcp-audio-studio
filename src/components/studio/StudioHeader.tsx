import React, { useState, useEffect } from 'react'
import { Sparkles, Sun, Moon, Plus, Bot } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { useVideoStore } from '../../stores/video-store'
import { useAgentStore } from '../../stores/agent-store'

interface StudioHeaderProps {
  onNewVideo?: () => void
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({ onNewVideo }) => {
  const { createNewProject } = useProjectStore()
  const { selectVideo } = useVideoStore()
  const isAgentActive = useAgentStore((state) => state.isAgentActive)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const savedTheme = (localStorage.getItem('studio_theme') as 'dark' | 'light') || 'dark'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('studio_theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }

  const handleNew = async () => {
    if (window.confirm('Start a new project? Current timeline will be cleared.')) {
      await selectVideo(null)
      await createNewProject('New Studio Project')
      onNewVideo?.()
    }
  }

  return (
    <header className="header-bar">
      {/* Left: Brand / Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold tracking-tight text-white dark:text-white" style={{ color: 'var(--foreground)' }}>
            Audio Studio
          </span>
          <span className="text-[10px] font-mono text-slate-500" style={{ color: 'var(--muted-foreground)' }}>
            WebMCP
          </span>
        </div>
      </div>

      {/* Right: Actions (New, Theme, Agent) */}
      <div className="flex items-center gap-2">
        {isAgentActive && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono"
            style={{
              background: 'rgba(6, 182, 212, 0.12)',
              color: 'var(--track-music)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
            }}
            title="WebMCP agent is connected and monitoring commands"
          >
            <Bot className="w-3 h-3" />
            <span>Agent</span>
          </div>
        )}

        <button
          onClick={handleNew}
          className="btn btn-ghost text-xs py-1 px-2.5"
          title="Start fresh project and video"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>

        <button
          onClick={toggleTheme}
          className="btn btn-ghost text-xs py-1 px-2.5"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span className="capitalize">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  )
}
