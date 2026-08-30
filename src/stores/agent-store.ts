import { create } from 'zustand'

export interface ToolLogItem {
  id: string
  toolName: string
  input: Record<string, unknown>
  output?: Record<string, unknown> | null
  status: 'running' | 'completed' | 'failed'
  error?: string
  startTime: number
  endTime?: number
  durationMs?: number
}

interface AgentStoreState {
  logs: ToolLogItem[]
  isAgentActive: boolean
  addLog: (toolName: string, input: Record<string, unknown>) => string
  updateLogSuccess: (id: string, output: Record<string, unknown>) => void
  updateLogFailure: (id: string, error: string) => void
  clearLogs: () => void
}

export const useAgentStore = create<AgentStoreState>((set) => ({
  logs: [],
  isAgentActive: false,

  addLog: (toolName, input) => {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const newLog: ToolLogItem = {
      id,
      toolName,
      input,
      status: 'running',
      startTime: Date.now(),
    }
    set((state) => ({
      logs: [newLog, ...state.logs],
      isAgentActive: true,
    }))
    return id
  },

  updateLogSuccess: (id, output) => {
    set((state) => {
      const now = Date.now()
      return {
        logs: state.logs.map((log) =>
          log.id === id
            ? {
                ...log,
                output,
                status: 'completed',
                endTime: now,
                durationMs: now - log.startTime,
              }
            : log,
        ),
        isAgentActive: state.logs.some((l) => l.id !== id && l.status === 'running'),
      }
    })
  },

  updateLogFailure: (id, error) => {
    set((state) => {
      const now = Date.now()
      return {
        logs: state.logs.map((log) =>
          log.id === id
            ? {
                ...log,
                error,
                status: 'failed',
                endTime: now,
                durationMs: now - log.startTime,
              }
            : log,
        ),
        isAgentActive: state.logs.some((l) => l.id !== id && l.status === 'running'),
      }
    })
  },

  clearLogs: () => set({ logs: [], isAgentActive: false }),
}))
