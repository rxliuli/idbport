import { describe, expect, it } from 'vitest'
import { parse, stringifyAsync } from './serializer'

describe('serializer', () => {
  it('json', async () => {
    const value = {
      a: 1,
      b: '2',
      c: null,
      d: {},
      e: [1, 2, 3],
    }
    const str = await stringifyAsync(value)
    const parsed = parse(str)
    expect(parsed).toEqual(value)
  })
  it('blob', async () => {
    const value = {
      a: 1,
      b: new Blob(['hello', 'world'], {
        type: 'text/plain',
      }),
    }
    const str = await stringifyAsync(value)
    const parsed = parse(str)
    expect(parsed).toEqual(value)
  })
  it('binary blob', async () => {
    async function blob2uint8(blob: Blob) {
      return new Uint8Array(await blob.arrayBuffer())
    }
    const blob = new Blob([new Uint8Array([128])])
    const str = await stringifyAsync(blob)
    const parsed = parse(str) as Blob
    expect(await blob2uint8(blob)).toEqual(await blob2uint8(parsed))
  })
})
