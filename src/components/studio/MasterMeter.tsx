import React, { useEffect, useRef } from 'react'
import { audioEngine } from '../../audio/engine'
import { usePlaybackStore } from '../../stores/playback-store'

export const MasterMeter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const analyser = audioEngine.getAnalyser()

    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      // Background grid
      ctx.fillStyle = '#090d16'
      ctx.fillRect(0, 0, width, height)

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteFrequencyData(dataArray)

        // Calculate average / peak level
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const avg = sum / bufferLength
        const levelPercent = Math.min(1, (avg / 128) * 1.2)

        // Draw stereo simulated bars
        const barWidth = (width - 4) / 2

        // Left Channel
        const barHeightL = height * levelPercent
        const gradL = ctx.createLinearGradient(0, height, 0, 0)
        gradL.addColorStop(0, '#10b981')
        gradL.addColorStop(0.7, '#06b6d4')
        gradL.addColorStop(0.9, '#f59e0b')
        gradL.addColorStop(1, '#f43f5e')

        ctx.fillStyle = gradL
        ctx.fillRect(1, height - barHeightL, barWidth, barHeightL)

        // Right Channel
        const barHeightR = height * Math.min(1, levelPercent * (0.95 + Math.random() * 0.1))
        ctx.fillRect(barWidth + 3, height - barHeightR, barWidth, barHeightR)
      } else {
        // Inactive idle line
        ctx.fillStyle = '#1f293d'
        ctx.fillRect(0, height - 2, width, 2)
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [isPlaying])

  return (
    <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800">
      <span className="text-[10px] font-mono font-bold text-slate-400">VU</span>
      <canvas
        ref={canvasRef}
        width={36}
        height={22}
        className="rounded bg-slate-900 border border-slate-800"
      />
    </div>
  )
}
