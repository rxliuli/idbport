import { deleteDB, openDB } from 'idb'
import { beforeEach, describe, expect, it } from 'vitest'

beforeEach(async () => {
  const list = await indexedDB.databases()
  await Promise.all(list.map((it) => deleteDB(it.name!)))
})

it('db version', async () => {
  const db = await openDB('test', 2)
  db.close()
  const db2 = await openDB('test')
  expect(db2.version).eq(2)
  db2.close()
})

it('write Unit8Array', async () => {
  const db = await openDB('test', 1, {
    upgrade(db) {
      db.createObjectStore('kv')
    },
  })
  await db.put(
    'kv',
    {
      id: 1,
      data: new Uint8Array([1, 2, 3]),
    },
    1,
  )
  expect(await db.get('kv', 1)).toEqual({
    id: 1,
    data: new Uint8Array([1, 2, 3]),
  })
  db.close()
})
