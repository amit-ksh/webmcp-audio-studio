import React, { useState, useEffect, useRef } from 'react'
import { useProjectStore } from '../../stores/project-store'
import { useVideoStore } from '../../stores/video-store'
import { StudioHeader } from './StudioHeader'
import { VideoUploader } from '../../features/video/components/VideoUploader'
import { VideoPreview } from '../../features/video/components/VideoPreview'
import { Timeline } from '../timeline/Timeline'
import { AudioControls } from './AudioControls'
import { VoiceoverPanel } from '../../features/voiceover/VoiceoverPanel'
import { MusicPanel } from '../../features/music/MusicPanel'
import { ExportModal } from './ExportModal'
import { WebMCPModal } from './WebMCPModal'
import { registerWebMCPTools } from '../../webmcp/register-tools'
import { commandBus } from '../../webmcp/bus'
import { AlertCircle } from 'lucide-react'

export const StudioShell: React.FC = () => {
  const {
    initStore: initProjectStore,
    updateProjectMeta,
  } = useProjectStore()
  const {
    videos,
    selectedVideoId,
    activeVideoObjectUrl,
    initStore: initVideoStore,
    selectVideo,
  } = useVideoStore()

  const [isVoiceoverOpen, setIsVoiceoverOpen] = useState(false)
  const [isMusicOpen, setIsMusicOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isWebMCPOpen, setIsWebMCPOpen] = useState(false)
  const [isChangingVideo, setIsChangingVideo] = useState(false)
  const [videoChangeError, setVideoChangeError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    initProjectStore()
    initVideoStore()
    registerWebMCPTools()
  }, [initProjectStore, initVideoStore])

  const activeVideo = videos.find((v) => v.id === selectedVideoId)
  const hasUploadedVideo = Boolean(activeVideo && activeVideoObjectUrl)

  const handleResetVideo = async () => {
    await selectVideo(null)
  }

  const handleVideoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsChangingVideo(true)
    setVideoChangeError(null)

    try {
      const result = await commandBus.execute({
        type: 'video.import',
        payload: { file },
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to import the selected video')
      }

      const video = result.data as { id: string; durationSec: number }
      await selectVideo(video.id)
      updateProjectMeta({ durationSec: Math.ceil(video.durationSec || 60) })
    } catch (error: unknown) {
      setVideoChangeError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsChangingVideo(false)
    }
  }

  return (
    <div className="studio-container">
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*,.mp4,.webm,.mov,.mkv,.ogg,.avi,.m4v"
        className="hidden"
        onChange={handleVideoFileChange}
      />

      {/* Top Application Header */}
      <StudioHeader
        onNewVideo={handleResetVideo}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenWebMCP={() => setIsWebMCPOpen(true)}
        hasVideo={hasUploadedVideo}
      />

      {/* Main Studio Viewport */}
      {!hasUploadedVideo ? (
        /* Section 4: Seamless Initial Upload State */
        <VideoUploader onUploaded={() => {}} />
      ) : (
        /* Unified Studio Editor Surface */
        <main className="w-full">
          {videoChangeError && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{videoChangeError}</span>
            </div>
          )}

          <div className="editor-surface">
            {/* 1. Video / Project Header & Video Preview Canvas */}
            <VideoPreview
              videoRef={videoRef}
              onChangeVideo={() => videoInputRef.current?.click()}
              isChangingVideo={isChangingVideo}
            />

            {/* 2. Timeline */}
            <Timeline />

            {/* 3. Audio Mixer */}
            <AudioControls
              onOpenVoiceoverModal={() => setIsVoiceoverOpen(true)}
              onOpenMusicModal={() => setIsMusicOpen(true)}
            />
          </div>
        </main>
      )}

      {/* Modals for Voiceover, Music, Export, and WebMCP Tools */}
      <VoiceoverPanel
        isOpen={isVoiceoverOpen}
        onClose={() => setIsVoiceoverOpen(false)}
      />

      <MusicPanel
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <WebMCPModal
        isOpen={isWebMCPOpen}
        onClose={() => setIsWebMCPOpen(false)}
      />
    </div>
  )
}
