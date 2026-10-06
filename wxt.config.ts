import { defineConfig, type UserManifest } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@extport/wxt'],
  extport: {
    extension: 'ext_xSjOP8VcVDL8DEMxch60',
    safari: {
      appCategory: 'public.app-category.productivity',
      bundleIdentifier: 'com.rxliuli.IDBPort',
      developmentTeam: 'N2X78TUUFG',
      issuerId: '48f39427-c063-4e33-98d2-31de80aad0be',
      keyId: '8N27UWG9RG',
    },
    analytics: true,
  },
  vite: () => ({
    plugins: [tailwindcss()] as any,
    resolve: {
      tsconfigPaths: true,
    },
  }),
  manifestVersion: 3,
  manifest: (env) => {
    const manifest: UserManifest = {
      name: 'IDBPort',
      description: 'IndexedDB data Export and Import',
      permissions: ['storage', 'activeTab', 'scripting'],
      author: {
        email: 'rxliuli@gmail.com',
      },
      action: {
        default_icon: {
          '16': 'icon/16.png',
          '32': 'icon/32.png',
          '48': 'icon/48.png',
          '96': 'icon/96.png',
          '128': 'icon/128.png',
        },
      },
      homepage_url: 'https://rxliuli.com',
    }
    if (env.browser === 'firefox') {
      manifest.browser_specific_settings = {
        gecko: {
          id: manifest.name?.toLowerCase() + '@rxliuli.com',
        },
        gecko_android: {},
      }
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/author
      // @ts-expect-error
      manifest.author = 'rxliuli'
    }
    return manifest
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      if (manifest.content_scripts?.length === 0) {
        // delete manifest.content_scripts
      }
      // The content script is registered at runtime (no `matches`), so WXT
      // generates the CSS `web_accessible_resources` entry with an empty
      // `matches` array, which makes the browser refuse to load the shadow-root
      // stylesheet (ERR_BLOCKED_BY_CLIENT) and leaves the UI unstyled.
      // Since the UI can be injected into any tab via activeTab, allow all origins.
      manifest.web_accessible_resources?.forEach((entry) => {
        if (typeof entry === 'string') return
        if (entry.matches?.length === 0) {
          entry.matches = ['<all_urls>']
        }
      })
    },
  },
  webExt: {
    disabled: true,
  },
})
