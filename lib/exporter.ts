import { IDBPCursorWithValue, IDBPDatabase, openDB } from 'idb'
import { deserialize, serializeAsync } from 'seroval'
import { sum } from 'es-toolkit'
import { BlobPlugin } from 'seroval-plugins/web'
import { ExpectedError } from './error'

function getNames(db: IDBPDatabase) {
  const names = []
  for (const name of db.objectStoreNames) {
    names.push(name)
  }
  return names
}

interface ExportMeta {
  name: string
  version: number
  stores: {
    name: string
    count: number
  }[]
}

async function getMeta(db: IDBPDatabase): Promise<ExportMeta> {
  const name = db.name
  const version = db.version
  const storeNames = getNames(db)

  const stores: ExportMeta['stores'] = []
  for (const storeName of storeNames) {
    stores.push({
      name: storeName,
      count: await db.count(storeName),
    })
  }
  return {
    name,
    version,
    stores,
  }
}

interface ExportItem {
  storeName: string
  key: IDBValidKey
  value: IDBPCursorWithValue
}

export async function* readableStore(options: {
  db: IDBPDatabase
  name: string
  limit: number
  signal?: AbortSignal
}): AsyncGenerator<{
  key: IDBValidKey
  value: any
}> {
  const { db, name, limit, signal } = options
  const storeNames = getNames(db)
  if (!storeNames.includes(name)) {
    throw new ExpectedError('store-not-found', `Store ${name} not found`)
  }
  let lastKey: IDBValidKey | undefined = undefined
  while (true) {
    const tx = db.transaction(name, 'readonly')
    const store = tx.objectStore(name)
    let cursor: IDBPCursorWithValue | null =
      lastKey === undefined
        ? await store.openCursor()
        : await store.openCursor(IDBKeyRange.lowerBound(lastKey, true))
    if (!cursor) {
      break
    }
    const parts: { key: IDBValidKey; value: any }[] = []
    let count = 0
    while (cursor && count < limit) {
      if (signal?.aborted) {
        throw new ExpectedError('aborted', 'Aborted')
      }
      parts.push({ key: cursor.key, value: cursor.value })
      lastKey = cursor.key
      cursor = await cursor.continue()
      count++
    }
    for (const part of parts) {
      if (signal?.aborted) {
        throw new ExpectedError('aborted', 'Aborted')
      }
      yield part
    }
    if (parts.length < limit) {
      break
    }
  }
}

interface ExportOptions {
  signal: AbortSignal
  onProgress: (data: {
    meta: ExportMeta
    progress: {
      current: number
      total: number
    }
  }) => void
}

export async function exportIDB(
  name: string,
  options?: ExportOptions,
): Promise<Blob> {
  const db = await openDB(name)
  try {
    const meta = await getMeta(db)
    const total = sum(meta.stores.map((it) => it.count))
    let current = 0
    let text = ''
    text += (await serializeAsync(meta)) + '\n'
    for (const { name } of meta.stores) {
      for await (const part of readableStore({
        db,
        name,
        limit: 10,
        signal: options?.signal,
      })) {
        text +=
          (await serializeAsync(
            {
              storeName: name,
              key: part.key,
              value: part.value,
            } satisfies ExportItem,
            {
              plugins: [BlobPlugin],
            },
          )) + '\n'
        current++
        options?.onProgress({
          meta,
          progress: { current, total },
        })
      }
    }
    return new Blob([text], { type: 'text/plain' })
  } finally {
    db.close()
  }
}

export async function importIDB(data: Blob, options?: ExportOptions) {
  const text = await data.text()
  const lines = text.split('\n').filter((it) => it.trim() !== '')
  const meta = deserialize(lines[0]) as ExportMeta
  const db = await openDB(meta.name, meta.version)
  try {
    if (db.objectStoreNames.length === 0) {
      throw new ExpectedError('empty-db', 'Empty database')
    }
    const storeNames = Array.from(db.objectStoreNames)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const item = deserialize(line) as ExportItem
      if (!storeNames.includes(item.storeName)) {
        throw new ExpectedError(
          'store-not-found',
          `Store ${item.storeName} not found`,
        )
      }
      const tx = db.transaction(item.storeName, 'readwrite')
      const store = tx.objectStore(item.storeName)
      const keyPath = store.keyPath
      if (keyPath === null) {
        await store.put(item.value, item.key)
      } else {
        await store.put(item.value)
      }
      options?.onProgress({
        meta,
        progress: { current: i, total: lines.length - 1 },
      })
      if (options?.signal?.aborted) {
        throw new ExpectedError('aborted', 'Aborted')
      }
    }
  } finally {
    db.close()
  }
}
