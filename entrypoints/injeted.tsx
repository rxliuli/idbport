import ReactDOM from 'react-dom/client'
import { ShadowProvider } from '@/integrations/shadow/ShadowProvider.tsx'
import { ThemeProvider } from '@/integrations/theme/ThemeProvider.tsx'
import App from './content/App'

export default defineUnlistedScript(async () => {
  if (document.querySelector('idb-port-ui')) {
    return
  }
  const ctx = new ContentScriptContext('injeted.js')
  const ui = await createShadowRootUi(ctx, {
    name: 'idb-port-ui',
    position: 'modal',
    anchor: 'body',
    onMount: (container) => {
      // Container is a body, and React warns when creating a root on the body, so create a wrapper div
      const app = document.createElement('div')
      container.append(app)

      // Create a root on the UI container and render a component
      const root = ReactDOM.createRoot(app)
      root.render(
        <ShadowProvider container={container}>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ShadowProvider>,
      )
      return root
    },
    onRemove: (root) => {
      // Unmount the root when the UI is removed
      root?.unmount()
    },
  })

  // 4. Mount the UI
  ui.mount()
})
