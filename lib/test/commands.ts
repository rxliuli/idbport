import type { BrowserCommands } from '@vitest/browser/context'
import type { BrowserCommandContext } from 'vitest/node'
import type { Page } from 'playwright'

type _CustomCommand<T extends BrowserCommands> = {
  [K in keyof Omit<T, 'readFile' | 'writeFile' | 'removeFile'>]: T[K] extends (
    ...args: infer P
  ) => infer R
    ? (ctx: BrowserCommandContext, ...args: P) => R
    : never
}

export const customCommands: _CustomCommand<BrowserCommands> = {
  selectFile: async (ctx, id) => {
    const { page } = ctx.provider.getCommandsContext(ctx.sessionId) as {
      page: Page
    }
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.click(`#${id}`)
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(__filename)
  },
}
