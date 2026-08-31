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
import { registerWebMCPTools } from '../../webmcp/register-tools'

export const StudioShell: React.FC = () => {
  const { initStore: initProjectStore } = useProjectStore()
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

  const videoRef = useRef<HTMLVideoElement | null>(null)

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

  return (
    <div className="studio-container">
      {/* Top Application Header */}
      <StudioHeader
        onNewVideo={handleResetVideo}
        onOpenExport={() => setIsExportOpen(true)}
        hasVideo={hasUploadedVideo}
      />

      {/* Main Studio Viewport */}
      {!hasUploadedVideo ? (
        /* Section 4: Seamless Initial Upload State */
        <VideoUploader onUploaded={() => {}} />
      ) : (
        /* Unified Studio Editor Surface */
        <main className="w-full">
          <div className="editor-surface">
            {/* 1. Video / Project Header & Video Preview Canvas */}
            <VideoPreview
              videoRef={videoRef}
              onNewVideo={handleResetVideo}
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

      {/* Modals for Voiceover, Music, and Export */}
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
    </div>
  )
}
