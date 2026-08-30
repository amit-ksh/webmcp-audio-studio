let audioCtx: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext is only available in the browser')
  }

  if (!audioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AudioCtxClass({
      latencyHint: 'interactive',
      sampleRate: 44100,
    })
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch((err) => {
      console.warn('Could not resume AudioContext automatically:', err)
    })
  }

  return audioCtx
}

export async function ensureAudioContextRunning(): Promise<AudioContext> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  return ctx
}
