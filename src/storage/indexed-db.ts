import { openDB, type IDBPDatabase } from 'idb'
import type { Project, AudioAsset, Transcript } from '../contracts/project'

const DB_NAME = 'webmcp_audio_studio_db'
const DB_VERSION = 1

interface StudioDBSchema {
  projects: {
    key: string
    value: Project
  }
  assets_meta: {
    key: string
    value: AudioAsset
  }
  assets_blob: {
    key: string
    value: Blob | ArrayBuffer
  }
  transcripts: {
    key: string
    value: Transcript
  }
}

let dbPromise: Promise<IDBPDatabase<StudioDBSchema>> | null = null

export function getDB(): Promise<IDBPDatabase<StudioDBSchema>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in the browser'))
  }
  if (!dbPromise) {
    dbPromise = openDB<StudioDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('assets_meta')) {
          db.createObjectStore('assets_meta', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('assets_blob')) {
          db.createObjectStore('assets_blob')
        }
        if (!db.objectStoreNames.contains('transcripts')) {
          db.createObjectStore('transcripts', { keyPath: 'assetId' })
        }
      },
    })
  }
  return dbPromise
}

// Project Repositories
export async function saveProject(project: Project): Promise<void> {
  const db = await getDB()
  await db.put('projects', project)
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB()
  return db.get('projects', id)
}

export async function listProjects(): Promise<Project[]> {
  const db = await getDB()
  return db.getAll('projects')
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('projects', id)
}

// Asset Repositories (Binary data stored separately from metadata)
export async function saveAsset(meta: AudioAsset, data: Blob | ArrayBuffer): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['assets_meta', 'assets_blob'], 'readwrite')
  await Promise.all([
    tx.objectStore('assets_meta').put(meta),
    tx.objectStore('assets_blob').put(data, meta.id),
    tx.done,
  ])
}

export async function getAssetMeta(id: string): Promise<AudioAsset | undefined> {
  const db = await getDB()
  return db.get('assets_meta', id)
}

export async function getAssetBlob(id: string): Promise<Blob | undefined> {
  const db = await getDB()
  const result = await db.get('assets_blob', id)
  if (!result) return undefined
  if (result instanceof Blob) return result
  return new Blob([result], { type: 'audio/wav' })
}

export async function listAssets(): Promise<AudioAsset[]> {
  const db = await getDB()
  return db.getAll('assets_meta')
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['assets_meta', 'assets_blob', 'transcripts'], 'readwrite')
  await Promise.all([
    tx.objectStore('assets_meta').delete(id),
    tx.objectStore('assets_blob').delete(id),
    tx.objectStore('transcripts').delete(id),
    tx.done,
  ])
}

// Transcript Repositories
export async function saveTranscript(transcript: Transcript): Promise<void> {
  const db = await getDB()
  await db.put('transcripts', transcript)
}

export async function getTranscript(assetId: string): Promise<Transcript | undefined> {
  const db = await getDB()
  return db.get('transcripts', assetId)
}
