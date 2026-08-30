import { create } from 'zustand'
import type { VideoAsset } from '../contracts/video'
import { listVideoAssets, getVideoAssetBlob } from '../storage/indexed-db'

interface VideoStoreState {
  videos: VideoAsset[]
  selectedVideoId: string | null
  activeVideoObjectUrl: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  isMuted: boolean
  volume: number
  isLoading: boolean
  error: string | null

  initStore: () => Promise<void>
  setVideos: (videos: VideoAsset[]) => void
  addVideo: (video: VideoAsset) => void
  removeVideo: (videoId: string) => void
  updateVideo: (videoId: string, patch: Partial<VideoAsset>) => void
  selectVideo: (videoId: string | null) => Promise<void>
  setPlaybackState: (
    state: Partial<{
      isPlaying: boolean
      currentTime: number
      duration: number
      isMuted: boolean
      volume: number
    }>,
  ) => void
  clearActiveVideoUrl: () => void
}

export const useVideoStore = create<VideoStoreState>((set, get) => ({
  videos: [],
  selectedVideoId: null,
  activeVideoObjectUrl: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isMuted: false,
  volume: 1.0,
  isLoading: false,
  error: null,

  initStore: async () => {
    try {
      set({ isLoading: true })
      const videos = await listVideoAssets()
      set({ videos, isLoading: false })
      if (videos.length > 0 && !get().selectedVideoId) {
        await get().selectVideo(videos[0].id)
      }
    } catch (err) {
      console.error('Failed to load video assets:', err)
      set({ isLoading: false, error: 'Failed to initialize video assets' })
    }
  },

  setVideos: (videos) => set({ videos }),

  addVideo: (video) => {
    set((state) => ({
      videos: [video, ...state.videos.filter((v) => v.id !== video.id)],
    }))
    if (!get().selectedVideoId) {
      get().selectVideo(video.id)
    }
  },

  removeVideo: (videoId) => {
    const currentSelected = get().selectedVideoId
    const currentUrl = get().activeVideoObjectUrl

    if (currentSelected === videoId && currentUrl) {
      URL.revokeObjectURL(currentUrl)
    }

    set((state) => {
      const remaining = state.videos.filter((v) => v.id !== videoId)
      const nextSelected =
        currentSelected === videoId ? (remaining.length > 0 ? remaining[0].id : null) : currentSelected
      return {
        videos: remaining,
        selectedVideoId: nextSelected,
        activeVideoObjectUrl: currentSelected === videoId && remaining.length === 0 ? null : state.activeVideoObjectUrl,
      }
    })

    if (get().selectedVideoId && get().selectedVideoId !== currentSelected) {
      get().selectVideo(get().selectedVideoId)
    }
  },

  updateVideo: (videoId, patch) => {
    set((state) => ({
      videos: state.videos.map((v) => (v.id === videoId ? { ...v, ...patch } : v)),
    }))
  },

  selectVideo: async (videoId) => {
    const previousUrl = get().activeVideoObjectUrl
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl)
    }

    if (!videoId) {
      set({
        selectedVideoId: null,
        activeVideoObjectUrl: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      })
      return
    }

    try {
      const blob = await getVideoAssetBlob(videoId)
      if (!blob) {
        set({ selectedVideoId: videoId, activeVideoObjectUrl: null })
        return
      }

      const objectUrl = URL.createObjectURL(blob)
      const videoMeta = get().videos.find((v) => v.id === videoId)

      set({
        selectedVideoId: videoId,
        activeVideoObjectUrl: objectUrl,
        duration: videoMeta?.durationSec || 0,
        currentTime: 0,
        isPlaying: false,
      })
    } catch (err) {
      console.error('Failed to create video object URL:', err)
      set({ selectedVideoId: videoId, activeVideoObjectUrl: null })
    }
  },

  setPlaybackState: (patch) => set((state) => ({ ...state, ...patch })),

  clearActiveVideoUrl: () => {
    const currentUrl = get().activeVideoObjectUrl
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl)
    }
    set({ activeVideoObjectUrl: null, isPlaying: false })
  },
}))
