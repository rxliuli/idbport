import type { Plugin } from './plugin'

export const InfinityPlugin: Plugin<number, string> = {
  name: 'Infinity',
  test(data) {
    return data === Infinity || data === -Infinity
  },
  stringify(data) {
    return data === Infinity ? 'Infinity' : '-Infinity'
  },
  parse(data) {
    return data === 'Infinity' ? Infinity : -Infinity
  },
}
