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
      {/* Studio Header */}
      <StudioHeader onNewVideo={handleResetVideo} />

      {/* Main Studio Viewport */}
      {!hasUploadedVideo ? (
        /* Section 4: Initial Upload State */
        <VideoUploader onUploaded={() => {}} />
      ) : (
        /* Section 5 to 11: Video & Audio Studio Workspace */
        <main className="flex flex-col gap-4 w-full pb-8">
          {/* Video Preview with Integrated Playback Controls */}
          <VideoPreview
            videoRef={videoRef}
            onNewVideo={handleResetVideo}
          />

          {/* Timeline */}
          <Timeline />

          {/* Audio Tracks & Controls */}
          <AudioControls
            onOpenVoiceoverModal={() => setIsVoiceoverOpen(true)}
            onOpenMusicModal={() => setIsMusicOpen(true)}
          />

          {/* Primary Export Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="btn btn-primary text-sm py-2.5 w-full font-semibold shadow-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
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
