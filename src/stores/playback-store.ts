import { create } from 'zustand'

interface PlaybackStoreState {
  isPlaying: boolean
  currentTime: number
  zoom: number // pixels per second
  masterVolume: number
  isLooping: boolean
  activeTab: 'studio' | 'editor' | 'agent'
  sidebarTab: 'assets' | 'voiceover' | 'music' | 'transcription' | 'mixer' | 'agent'

  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setZoom: (zoom: number) => void
  setMasterVolume: (volume: number) => void
  setIsLooping: (looping: boolean) => void
  setActiveTab: (tab: 'studio' | 'editor' | 'agent') => void
  setSidebarTab: (tab: 'assets' | 'voiceover' | 'music' | 'transcription' | 'mixer' | 'agent') => void
}

export const usePlaybackStore = create<PlaybackStoreState>((set) => ({
  isPlaying: false,
  currentTime: 0,
  zoom: 60, // 60px per second by default
  masterVolume: 1.0,
  isLooping: false,
  activeTab: 'studio',
  sidebarTab: 'assets',

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(300, zoom)) }),
  setMasterVolume: (masterVolume) => set({ masterVolume: Math.max(0, Math.min(1.5, masterVolume)) }),
  setIsLooping: (isLooping) => set({ isLooping }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
}))
