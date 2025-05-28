import type { Plugin } from './plugin'

export const ZeroPlugin: Plugin<number, string> = {
  name: 'Zero',
  test(data) {
    return Object.is(data, -0)
  },
  stringify() {
    return ''
  },
  parse() {
    return -0
  },
}
