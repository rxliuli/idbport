import { defineConfig } from 'vitest/config'
import { customCommands } from './lib/test/commands'

const browserIncludes = ['lib/**/*.browser.test.ts']

export default defineConfig({
  test: {
    workspace: [
      {
        test: {
          // an example of file based convention,
          // you don't have to follow it
          include: ['src/**/*.test.ts'],
          exclude: browserIncludes,
          name: 'unit',
          environment: 'node',
        },
        plugins: [],
      },
      {
        test: {
          browser: {
            enabled: true,
            provider: 'playwright',
            // https://vitest.dev/guide/browser/playwright
            instances: [{ browser: 'chromium', headless: true }],
            commands: customCommands,
          },
        },
      },
    ],
  },
})
