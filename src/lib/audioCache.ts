const DB_NAME = 'StudifyAudioCache'
const STORE_NAME = 'audio_files'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CachedAudio {
  url: string
  word: string
  blob: Blob
  cachedAt: number
}

let db: IDBDatabase | null = null

async function getDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      db = req.result
      resolve(db)
    }
    req.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'url' })
      }
    }
  })
}

export async function getCachedAudio(url: string): Promise<Blob | null> {
  try {
    const database = await getDB()
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(url)

      req.onsuccess = () => {
        const item = req.result as CachedAudio | undefined
        if (!item) {
          resolve(null)
          return
        }

        const now = Date.now()
        const age = now - item.cachedAt
        if (age > CACHE_TTL_MS) {
          // Expired, delete it
          const delTx = database.transaction(STORE_NAME, 'readwrite')
          delTx.objectStore(STORE_NAME).delete(url)
          resolve(null)
          return
        }

        resolve(item.blob)
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function setCachedAudio(url: string, word: string, blob: Blob): Promise<void> {
  try {
    const database = await getDB()
    const item: CachedAudio = { url, word, blob, cachedAt: Date.now() }
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(item)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.error('Failed to cache audio:', e)
  }
}

export async function clearAudioCache(): Promise<void> {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite')
      const req = tx.objectStore(STORE_NAME).clear()
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.error('Failed to clear audio cache:', e)
  }
}

export async function getAudioCacheSize(): Promise<number> {
  try {
    const database = await getDB()
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => {
        const items = req.result as CachedAudio[]
        const totalBytes = items.reduce((sum, item) => sum + item.blob.size, 0)
        resolve(totalBytes)
      }
      req.onerror = () => resolve(0)
    })
  } catch {
    return 0
  }
}
