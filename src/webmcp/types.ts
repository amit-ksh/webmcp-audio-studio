export interface WebMCPToolDefinition {
  name: string
  description: string
  readOnlyHint: boolean
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface WebMCPToolCall<T = Record<string, unknown>> {
  name: string
  arguments: T
}

export interface WebMCPToolResult<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface ModelContextHost {
  registerTool: (tool: {
    name: string
    description: string
    parameters: unknown
    execute: (args: Record<string, unknown>) => Promise<unknown>
  }) => void
}

declare global {
  interface Document {
    modelContext?: ModelContextHost
  }
  interface Window {
    modelContext?: ModelContextHost
    __webmcp_callTool?: (toolName: string, args: Record<string, unknown>) => Promise<unknown>
  }
}
