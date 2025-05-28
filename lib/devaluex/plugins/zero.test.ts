import { expect, it } from 'vitest'
import { parse, stringifyAsync } from '../devaluex'
import { ZeroPlugin } from './zero'

async function s(value: any): Promise<string> {
  return stringifyAsync(value, {
    plugins: [ZeroPlugin],
  })
}

function p(value: string): any {
  return parse(value, {
    plugins: [ZeroPlugin],
  })
}

it('negative zero', async () => {
  const r1 = p(await s(-0))
  expect(Object.is(r1, -0)).true
  expect(Object.is(r1, 0)).false
  const r2 = p(await s(0))
  expect(Object.is(r2, -0)).false
  expect(Object.is(r2, 0)).true
})
