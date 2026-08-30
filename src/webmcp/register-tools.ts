import { WEBMCP_TOOLS } from './tool-definitions'
import { executeWebMCPTool } from './tool-executors'
import type { WebMCPToolDefinition } from './types'

let isRegistered = false

export function registerWebMCPTools(): {
  registeredCount: number
  tools: WebMCPToolDefinition[]
} {
  if (typeof window === 'undefined') {
    return { registeredCount: 0, tools: [] }
  }

  // Setup direct window test caller
  window.__webmcp_callTool = async (toolName: string, args: Record<string, unknown> = {}) => {
    return executeWebMCPTool(toolName, args)
  }

  const modelContext = document.modelContext || window.modelContext

  if (modelContext && typeof modelContext.registerTool === 'function') {
    for (const tool of WEBMCP_TOOLS) {
      try {
        modelContext.registerTool({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          execute: async (args: Record<string, unknown>) => {
            return executeWebMCPTool(tool.name, args)
          },
        })
      } catch (err) {
        console.warn(`Could not register tool "${tool.name}" with modelContext:`, err)
      }
    }
  }

  isRegistered = true
  return { registeredCount: WEBMCP_TOOLS.length, tools: WEBMCP_TOOLS }
}

export function areToolsRegistered(): boolean {
  return isRegistered
}
