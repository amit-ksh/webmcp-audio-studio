import { create } from 'zustand'
import type { Project, AudioAsset, Track, Clip, TrackType, DuckingConfig } from '../contracts/project'
import { saveProject, listProjects, listAssets, deleteProject as deleteProjectDB } from '../storage/indexed-db'
import { generateId } from '../lib/utils'

interface ProjectStoreState {
  currentProject: Project | null
  projectList: Project[]
  assets: AudioAsset[]
  selectedTrackId: string | null
  selectedClipId: string | null
  isLoading: boolean

  // Project Actions
  initStore: () => Promise<void>
  createNewProject: (name?: string) => Promise<Project>
  loadProject: (id: string) => Promise<void>
  saveCurrentProject: () => Promise<void>
  deleteProject: (id: string) => Promise<void>
  updateProjectMeta: (patch: Partial<Project>) => void

  // Track Actions
  addTrack: (type: TrackType, name?: string) => void
  removeTrack: (trackId: string) => void
  setTrackGain: (trackId: string, gain: number) => void
  toggleTrackMute: (trackId: string) => void
  toggleTrackSolo: (trackId: string) => void

  // Clip Actions
  addClipToTrack: (trackId: string, clip: Omit<Clip, 'id' | 'trackId'>) => Clip | null
  updateClip: (clipId: string, patch: Partial<Clip>) => void
  removeClip: (clipId: string) => void
  selectClip: (clipId: string | null) => void
  selectTrack: (trackId: string | null) => void

  // Mixer & Ducking
  setDuckingConfig: (config: Partial<DuckingConfig>) => void
  setMasterGain: (gain: number) => void

  // Asset Actions
  setAssets: (assets: AudioAsset[]) => void
  addAsset: (asset: AudioAsset) => void
  removeAsset: (assetId: string) => void
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  currentProject: null,
  projectList: [],
  assets: [],
  selectedTrackId: null,
  selectedClipId: null,
  isLoading: true,

  initStore: async () => {
    try {
      const [projects, assets] = await Promise.all([listProjects(), listAssets()])
      set({ projectList: projects, assets, isLoading: false })
      if (projects.length > 0 && !get().currentProject) {
        set({ currentProject: projects[0] })
      } else if (projects.length === 0) {
        await get().createNewProject('New Demo Project')
      }
    } catch (err) {
      console.error('Failed to initialize project store:', err)
      set({ isLoading: false })
    }
  },

  createNewProject: async (name = 'Untitled Project') => {
    const defaultVoiceTrack: Track = {
      id: generateId('track_voice'),
      name: 'Voiceover',
      type: 'voiceover',
      gain: 1.0,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    }

    const defaultMusicTrack: Track = {
      id: generateId('track_music'),
      name: 'Backing Music',
      type: 'music',
      gain: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    }

    const defaultSfxTrack: Track = {
      id: generateId('track_sfx'),
      name: 'Sound FX',
      type: 'sfx',
      gain: 0.9,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    }

    const newProject: Project = {
      id: generateId('proj'),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      durationSec: 60,
      sampleRate: 44100,
      tracks: [defaultVoiceTrack, defaultMusicTrack, defaultSfxTrack],
      ducking: {
        enabled: true,
        duckingAmountDb: -14,
        attackSec: 0.05,
        releaseSec: 0.3,
        thresholdDb: -30,
      },
      masterGain: 1.0,
    }

    await saveProject(newProject)
    const projects = await listProjects()
    set({ currentProject: newProject, projectList: projects, selectedTrackId: defaultVoiceTrack.id })
    return newProject
  },

  loadProject: async (id: string) => {
    const project = get().projectList.find((p) => p.id === id)
    if (project) {
      set({ currentProject: project, selectedClipId: null })
    }
  },

  saveCurrentProject: async () => {
    const current = get().currentProject
    if (!current) return
    const updated = { ...current, updatedAt: Date.now() }
    await saveProject(updated)
    const projects = await listProjects()
    set({ currentProject: updated, projectList: projects })
  },

  deleteProject: async (id: string) => {
    await deleteProjectDB(id)
    const projects = await listProjects()
    set({
      projectList: projects,
      currentProject: projects.length > 0 ? projects[0] : null,
    })
    if (projects.length === 0) {
      await get().createNewProject('New Demo Project')
    }
  },

  updateProjectMeta: (patch) => {
    const current = get().currentProject
    if (!current) return
    const updated = { ...current, ...patch, updatedAt: Date.now() }
    set({ currentProject: updated })
    saveProject(updated)
  },

  addTrack: (type, name) => {
    const current = get().currentProject
    if (!current) return
    const newTrack: Track = {
      id: generateId(`track_${type}`),
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Track`,
      type,
      gain: 1.0,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    }
    const updated = {
      ...current,
      tracks: [...current.tracks, newTrack],
      updatedAt: Date.now(),
    }
    set({ currentProject: updated, selectedTrackId: newTrack.id })
    saveProject(updated)
  },

  removeTrack: (trackId) => {
    const current = get().currentProject
    if (!current) return
    const updated = {
      ...current,
      tracks: current.tracks.filter((t) => t.id !== trackId),
      updatedAt: Date.now(),
    }
    set({
      currentProject: updated,
      selectedTrackId: get().selectedTrackId === trackId ? null : get().selectedTrackId,
    })
    saveProject(updated)
  },

  setTrackGain: (trackId, gain) => {
    const current = get().currentProject
    if (!current) return
    const updated = {
      ...current,
      tracks: current.tracks.map((t) => (t.id === trackId ? { ...t, gain } : t)),
      updatedAt: Date.now(),
    }
    set({ currentProject: updated })
    saveProject(updated)
  },

  toggleTrackMute: (trackId) => {
    const current = get().currentProject
    if (!current) return
    const updated = {
      ...current,
      tracks: current.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
      updatedAt: Date.now(),
    }
    set({ currentProject: updated })
    saveProject(updated)
  },

  toggleTrackSolo: (trackId) => {
    const current = get().currentProject
    if (!current) return
    const updated = {
      ...current,
      tracks: current.tracks.map((t) => (t.id === trackId ? { ...t, solo: !t.solo } : t)),
      updatedAt: Date.now(),
    }
    set({ currentProject: updated })
    saveProject(updated)
  },

  addClipToTrack: (trackId, clipData) => {
    const current = get().currentProject
    if (!current) return null
    const targetTrack = current.tracks.find((t) => t.id === trackId)
    if (!targetTrack) return null

    const newClip: Clip = {
      ...clipData,
      id: generateId('clip'),
      trackId,
    }

    const updated = {
      ...current,
      tracks: current.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t,
      ),
      updatedAt: Date.now(),
    }

    // Expand project duration if clip exceeds duration
    if (newClip.startSec + newClip.durationSec > updated.durationSec) {
      updated.durationSec = Math.ceil(newClip.startSec + newClip.durationSec + 5)
    }

    set({ currentProject: updated, selectedClipId: newClip.id })
    saveProject(updated)
    return newClip
  },

  updateClip: (clipId, patch) => {
    const current = get().currentProject
    if (!current) return
    const updated = {
      ...current,
      tracks: current.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((c) => (c.id === clipId ? { ...c, ...patch } : c)),
      })),
      updatedAt: Date.now(),
    }
    set({ currentProject: updated })
    saveProject(updated)
  },

  removeClip: (clipId) => {
    const current = get().currentProject
    if (!current) return
    const updated = {
      ...current,
      tracks: current.tracks.map((track) => ({
        ...track,
        clips: track.clips.filter((c) => c.id !== clipId),
      })),
      updatedAt: Date.now(),
    }
    set({
      currentProject: updated,
      selectedClipId: get().selectedClipId === clipId ? null : get().selectedClipId,
    })
    saveProject(updated)
  },

  selectClip: (clipId) => set({ selectedClipId: clipId }),
  selectTrack: (trackId) => set({ selectedTrackId: trackId }),

  setDuckingConfig: (config) => {
    const current = get().currentProject
    if (!current) return
    const updated = {
      ...current,
      ducking: { ...current.ducking, ...config },
      updatedAt: Date.now(),
    }
    set({ currentProject: updated })
    saveProject(updated)
  },

  setMasterGain: (gain) => {
    const current = get().currentProject
    if (!current) return
    const updated = { ...current, masterGain: gain, updatedAt: Date.now() }
    set({ currentProject: updated })
    saveProject(updated)
  },

  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => set((state) => ({ assets: [asset, ...state.assets.filter((a) => a.id !== asset.id)] })),
  removeAsset: (assetId) =>
    set((state) => ({ assets: state.assets.filter((a) => a.id !== assetId) })),
}))
