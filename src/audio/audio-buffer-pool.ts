import { getAudioContext } from './audio-context'
import { getAssetBlob } from '../storage/indexed-db'

const bufferCache = new Map<string, AudioBuffer>()

export async function getDecodedAudioBuffer(
  assetId: string,
  rawBlobOrBuffer?: Blob | ArrayBuffer,
): Promise<AudioBuffer> {
  if (bufferCache.has(assetId)) {
    return bufferCache.get(assetId)!
  }

  let arrayBuffer: ArrayBuffer
  if (rawBlobOrBuffer) {
    if (rawBlobOrBuffer instanceof Blob) {
      arrayBuffer = await rawBlobOrBuffer.arrayBuffer()
    } else {
      arrayBuffer = rawBlobOrBuffer
    }
  } else {
    const blob = await getAssetBlob(assetId)
    if (!blob) {
      throw new Error(`Audio asset not found in storage: ${assetId}`)
    }
    arrayBuffer = await blob.arrayBuffer()
  }

  const ctx = getAudioContext()
  // Clone ArrayBuffer to avoid detached buffer issues in some WebKit/Blink versions
  const cloned = arrayBuffer.slice(0)
  const decoded = await ctx.decodeAudioData(cloned)

  bufferCache.set(assetId, decoded)
  return decoded
}

export function cacheAudioBuffer(assetId: string, buffer: AudioBuffer): void {
  bufferCache.set(assetId, buffer)
}

export function removeAudioBufferFromCache(assetId: string): void {
  bufferCache.delete(assetId)
}

export function clearAudioBufferCache(): void {
  bufferCache.clear()
}
