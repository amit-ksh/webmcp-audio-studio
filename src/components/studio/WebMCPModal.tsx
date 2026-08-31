import React, { useState } from 'react'
import { X, Bot, Search, Terminal, Check, Copy, ChevronDown, ChevronRight, ShieldCheck, Wrench } from 'lucide-react'
import { WEBMCP_TOOLS } from '../../webmcp/tool-definitions'
import type { WebMCPToolDefinition } from '../../webmcp/types'

interface WebMCPModalProps {
  isOpen: boolean
  onClose: () => void
}

export const WebMCPModal: React.FC<WebMCPModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'readonly' | 'action'>('all')
  const [expandedTool, setExpandedTool] = useState<string | null>(null)
  const [copiedTool, setCopiedTool] = useState<string | null>(null)

  if (!isOpen) return null

  const filteredTools = WEBMCP_TOOLS.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (filterType === 'readonly') return tool.readOnlyHint
    if (filterType === 'action') return !tool.readOnlyHint
    return true
  })

  const handleCopySchema = (tool: WebMCPToolDefinition) => {
    navigator.clipboard.writeText(JSON.stringify(tool, null, 2))
    setCopiedTool(tool.name)
    setTimeout(() => setCopiedTool(null), 2000)
  }

  const toggleExpand = (name: string) => {
    setExpandedTool(expandedTool === name ? null : name)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog modal-dialog-wide p-0 flex flex-col bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  WebMCP Protocol Tools
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {WEBMCP_TOOLS.length} Registered
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Browser-native agent tools controlling the video & audio studio
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          aria-label="Close WebMCP tools"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-5 py-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tools by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input text-xs pl-8 py-1.5 rounded-lg border-slate-200"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${
                filterType === 'all'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({WEBMCP_TOOLS.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('readonly')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${
                filterType === 'readonly'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Read-Only ({WEBMCP_TOOLS.filter((t) => t.readOnlyHint).length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('action')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${
                filterType === 'action'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Mutating ({WEBMCP_TOOLS.filter((t) => !t.readOnlyHint).length})
            </button>
          </div>
        </div>

        {/* Scrollable Tool List */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 bg-slate-50/40">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No WebMCP tools found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredTools.map((tool) => {
              const isExpanded = expandedTool === tool.name
              const paramKeys = Object.keys(tool.parameters?.properties || {})
              const requiredKeys = tool.parameters?.required || []

              return (
                <div
                  key={tool.name}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all"
                >
                  {/* Tool Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 cursor-pointer select-none"
                      onClick={() => toggleExpand(tool.name)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors">
                          {tool.name}
                        </span>

                        {tool.readOnlyHint ? (
                          <span className="inline-flex items-center gap-1 text-[10px] leading-none font-mono font-medium px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                            read-only
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] leading-none font-mono font-medium px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            <Wrench className="w-2.5 h-2.5 text-purple-600" />
                            action
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>

                    {/* Actions: Copy schema & Expand */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopySchema(tool)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Copy JSON Tool Definition"
                      >
                        {copiedTool === tool.name ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {paramKeys.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(tool.name)}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Toggle parameters"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Parameters View */}
                  {isExpanded && paramKeys.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                        Parameters ({paramKeys.length})
                      </span>

                      <div className="grid grid-cols-1 gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                        {paramKeys.map((key) => {
                          const prop = tool.parameters.properties[key] as
                            | { type?: string; description?: string }
                            | undefined
                          const isRequired = requiredKeys.includes(key)

                          return (
                            <div
                              key={key}
                              className="flex flex-col gap-0.5 text-xs text-slate-700 pb-1.5 last:pb-0 border-b border-slate-200/60 last:border-0"
                            >
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="font-semibold text-slate-900">
                                  {key}
                                </span>
                                <span className="text-[10px] text-blue-600 font-medium">
                                  ({prop?.type || 'any'})
                                </span>
                                {isRequired ? (
                                  <span className="text-[9px] leading-none font-mono px-1.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                    required
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono text-slate-400">
                                    optional
                                  </span>
                                )}
                              </div>
                              {prop?.description && (
                                <p className="text-[11px] text-slate-500">
                                  {prop.description}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 px-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>Accessible via Command Bus & Agent runtime</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary text-xs py-1 px-3 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
