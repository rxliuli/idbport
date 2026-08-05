import { defineConfig } from 'vitest/config'
import { customCommands } from './lib/test/commands'
import { playwright } from '@vitest/browser-playwright'

const browserIncludes = ['lib/**/*.browser.test.ts']

export default defineConfig({
  test: {
    projects: [
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
            provider: playwright(),
            enabled: true,
            // https://vitest.dev/guide/browser/playwright
            instances: [{ browser: 'chromium', headless: true }],
            commands: customCommands,
          },
        },
      },
    ],
  },
})
