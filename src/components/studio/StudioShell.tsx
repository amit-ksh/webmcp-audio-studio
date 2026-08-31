import React, { useState, useEffect, useRef } from 'react'
import { Download } from 'lucide-react'
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
      {/* Studio Top Header */}
      <StudioHeader
        onNewVideo={handleResetVideo}
        onOpenExport={() => setIsExportOpen(true)}
        hasVideo={hasUploadedVideo}
      />

      {/* Main Studio Viewport */}
      {!hasUploadedVideo ? (
        /* Initial Upload State: Blended Dropzone */
        <VideoUploader onUploaded={() => {}} />
      ) : (
        /* Connected Studio Workbench */
        <main className="flex flex-col gap-4 w-full">
          {/* Unified Connected Workbench Box */}
          <div className="studio-workbench">
            {/* 1. Top Video Stage */}
            <VideoPreview
              videoRef={videoRef}
              onNewVideo={handleResetVideo}
            />

            {/* 2. Middle Connected Timeline */}
            <Timeline />

            {/* 3. Bottom Connected Audio Deck */}
            <AudioControls
              onOpenVoiceoverModal={() => setIsVoiceoverOpen(true)}
              onOpenMusicModal={() => setIsMusicOpen(true)}
            />
          </div>

          {/* Primary Big Export Button */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="btn btn-primary text-sm py-3.5 w-full rounded-xl font-bold shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Final Video & Audio</span>
            </button>
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
