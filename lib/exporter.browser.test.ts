import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportIDB, importIDB } from './exporter'
import { deleteDB, openDB } from 'idb'

const cleanup = async () => {
  const list = await indexedDB.databases()
  await Promise.all(list.map((it) => deleteDB(it.name!)))
}
beforeEach(cleanup)
afterEach(cleanup)

describe('export and import for type', () => {
  async function receive(value: any) {
    const db = await openDB<{
      user: {
        key: number
        value: any
      }
    }>('test', 1, {
      upgrade(db) {
        db.createObjectStore('user')
      },
    })
    await db.put('user', value, 1)
    expect(await db.count('user')).eq(1)
    const data = await exportIDB('test')
    await db.clear('user')
    expect(await db.count('user')).eq(0)
    await importIDB(data)
    expect(await db.count('user')).eq(1)
    expect(await db.get('user', 1)).toEqual(value)
    db.close()
  }

  it('JSON', async () => {
    await receive({ name: 'John', age: 18 })
  })
  it('Date', async () => {
    await receive(new Date())
  })
  it('RegExp', async () => {
    await receive(/^[a-z]+$/)
  })
  it('Uint8Array', async () => {
    await receive(new Uint8Array([1, 2, 3]))
  })
  it('Blob', async () => {
    await receive(new Blob(['test'], { type: 'text/plain' }))
  })
})

describe('export and import for store', () => {
  async function createDB() {
    const db = await openDB<{
      user: {
        key: number
        value: any
      }
    }>('test', 1, {
      upgrade(db) {
        db.createObjectStore('user')
      },
    })
    return db
  }
  it('multiple items', async () => {
    const db = await openDB<{
      user: {
        key: number
        value: any
      }
    }>('test', 1, {
      upgrade(db) {
        db.createObjectStore('user')
      },
    })
    db.put('user', { name: 'John', age: 18 }, 1)
    db.put('user', { name: 'Jane', age: 20 }, 2)
    const data = await exportIDB('test')
    await db.clear('user')
    await importIDB(data)
    expect(await db.count('user')).eq(2)
    expect(await db.get('user', 1)).toEqual({ name: 'John', age: 18 })
    expect(await db.get('user', 2)).toEqual({ name: 'Jane', age: 20 })
    db.close()
  })
  it('empty db', async () => {
    const db = await createDB()
    await db.put('user', { name: 'John', age: 18 }, 1)
    const data = await exportIDB('test')
    db.close()
    await deleteDB('test')
    await expect(importIDB(data)).rejects.toThrow('Empty database')
  })
  it('store not found', async () => {
    const db = await openDB('test', 1, {
      upgrade(db) {
        db.createObjectStore('user')
      },
    })
    await db.put('user', { name: 'John', age: 18 }, 1)
    const data = await exportIDB('test')
    db.close()
    await deleteDB('test')
    const db2 = await openDB('test', 1, {
      upgrade(db) {
        db.createObjectStore('user2')
      },
    })
    db2.close()
    await expect(importIDB(data)).rejects.toThrow('Store user not found')
  })
  it('export aborted', async () => {
    const db = await createDB()
    await db.put('user', { name: 'John', age: 18 }, 1)
    await db.put('user', { name: 'Jane', age: 20 }, 2)
    db.close()
    const controller = new AbortController()
    await expect(
      exportIDB('test', {
        signal: controller.signal,
        onProgress: (data) => {
          if (data.progress.current === 1) {
            controller.abort()
          }
        },
      }),
    ).rejects.toThrow('Aborted')
  })
  it('import aborted', async () => {
    const db = await createDB()
    await db.put('user', { name: 'John', age: 18 }, 1)
    await db.put('user', { name: 'Jane', age: 20 }, 2)
    db.close()
    const data = await exportIDB('test')
    const controller = new AbortController()
    await expect(
      importIDB(data, {
        signal: controller.signal,
        onProgress: (data) => {
          if (data.progress.current === 1) {
            controller.abort()
          }
        },
      }),
    ).rejects.toThrow('Aborted')
  })
  it('inline key path', async () => {
    const db = await openDB<{
      user: {
        key: number
        value: { id: number; name: string }
      }
    }>('test', 1, {
      upgrade(db) {
        db.createObjectStore('user', { keyPath: 'id' })
      },
    })
    db.put('user', { id: 1, name: 'John' })
    db.put('user', { id: 2, name: 'Jane' })
    const data = await exportIDB('test')
    await db.clear('user')
    expect(await db.count('user')).eq(0)
    await importIDB(data)
    expect(await db.count('user')).eq(2)
    db.close()
  })
  it('export large data', async () => {
    const users = Array.from({ length: 1000 }).map((_, i) => ({
      id: i,
      name: `name ${i}`,
    }))
    const db = await openDB('test', 1, {
      upgrade(db) {
        db.createObjectStore('user')
      },
    })
    for (const it of users) {
      await db.put('user', it, it.id)
    }
    const onProgress = vi.fn()
    const data = await exportIDB('test', {
      signal: new AbortController().signal,
      onProgress,
    })
    expect(onProgress).toHaveBeenCalledTimes(1000)
    await db.clear('user')
    expect(await db.count('user')).eq(0)
    await importIDB(data)
    expect(await db.count('user')).eq(users.length)
    db.close()
  })
})

describe('export and import for performance', () => {
  function createLargeBlob(sizeInBytes: number) {
    const buffer = new Uint8Array(sizeInBytes)
    for (let i = 0; i < sizeInBytes; i++) {
      buffer[i] = i % 256
    }
    return new Blob([buffer], { type: 'application/octet-stream' })
  }

  it.skip('export large data', async () => {
    const db = await openDB<{
      largeObjects: Uint8Array
    }>('test-large', 1, {
      upgrade(db) {
        db.createObjectStore('largeObjects')
      },
    })
    for (let i = 0; i < 1000; i++) {
      await db.put(
        'largeObjects',
        new Uint8Array(await createLargeBlob(1024 * 1024).arrayBuffer()),
        i,
      )
    }
    db.close()
  })
})
