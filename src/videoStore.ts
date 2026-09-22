// Video files are too big for localStorage, so they live in IndexedDB.

const DB_NAME = 'selftape-game'
const STORE = 'videos'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export const saveVideo = (id: string, file: Blob) => run('readwrite', (s) => s.put(file, id))
export const loadVideo = (id: string) => run<Blob | undefined>('readonly', (s) => s.get(id))
export const deleteVideo = (id: string) => run('readwrite', (s) => s.delete(id))
