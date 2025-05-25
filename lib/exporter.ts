import { IDBPCursorWithValue, IDBPDatabase, openDB } from 'idb'
import { sum } from 'es-toolkit'
import { ExpectedError } from './error'
import { TextReader, TextWriter } from './io'
import { parse, stringifyAsync } from './serializer'

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
  const writer = new TextWriter()
  try {
    const meta = await getMeta(db)
    const total = sum(meta.stores.map((it) => it.count))
    let current = 0
    writer.writeLine(await stringifyAsync(meta))
    for (const { name } of meta.stores) {
      for await (const part of readableStore({
        db,
        name,
        limit: 100,
        signal: options?.signal,
      })) {
        const line = await stringifyAsync({
          storeName: name,
          key: part.key,
          value: part.value,
        } satisfies ExportItem)
        writer.writeLine(line)
        current++
        options?.onProgress({
          meta,
          progress: { current, total },
        })
      }
    }
    await writer.close()
    return await writer.getData()
  } finally {
    db.close()
    await writer.close()
  }
}

export async function importIDB(data: Blob, options?: ExportOptions) {
  const reader = new TextReader(data)
  const lineReader = reader.readLine().getReader()
  const metaChunk = await lineReader.read()
  if (!metaChunk.value) {
    throw new ExpectedError('data-error', 'Data error')
  }
  const meta = parse(metaChunk.value) as ExportMeta
  let db: IDBPDatabase | null = null
  try {
    db = await openDB(meta.name, meta.version)
    if (db.objectStoreNames.length === 0) {
      throw new ExpectedError('empty-db', 'Empty database')
    }
    const storeNames = getNames(db)
    const total = meta.stores.reduce((acc, it) => acc + it.count, 0)
    let i = 1
    while (true) {
      const chunk = await lineReader.read()
      if (chunk.done) {
        break
      }
      const item = parse(chunk.value) as ExportItem
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
        progress: {
          current: i,
          total: total,
        },
      })
      if (options?.signal?.aborted) {
        throw new ExpectedError('aborted', 'Aborted')
      }
      i++
    }
  } finally {
    db?.close()
  }
}
