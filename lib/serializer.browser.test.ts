import { describe, expect, it } from 'vitest'
import { parse, stringifyAsync } from './serializer'

describe('serializer', () => {
  it('json', async () => {
    const value = {
      a: 1,
      b: '2',
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
})
