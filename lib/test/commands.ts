import { BrowserCommands } from '@vitest/browser/context'
import { type BrowserCommandContext } from 'vitest/node'

type _CustomCommand<T extends BrowserCommands> = {
  [K in keyof Omit<T, 'readFile' | 'writeFile' | 'removeFile'>]: T[K] extends (
    ...args: infer P
  ) => infer R
    ? (ctx: BrowserCommandContext, ...args: P) => R
    : never
}

export const customCommands: _CustomCommand<BrowserCommands> = {
  selectFile: async (ctx, id) => {
    const fileChooserPromise = ctx.page.waitForEvent('filechooser')
    await ctx.page.click(`#${id}`)
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(__filename)
  },
}
