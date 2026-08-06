import ReactDOM from 'react-dom/client'
import App from './content/App'
import './content/style.css'
import 'sonner/dist/styles.css'
import { toggle } from '@/integrations/dialog/open'
import { createElement } from 'react'

export default defineContentScript({
  cssInjectionMode: 'ui',
  registration: 'runtime',
  async main(ctx) {
    if (document.querySelector('idb-port-ui')) {
      toggle()
      return
    }
    const ui = await createShadowRootUi(ctx, {
      name: 'idb-port-ui',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        container.style.position = 'fixed'
        container.style.zIndex = '9999'

        // Container is a body, and React warns when creating a root on the body, so create a wrapper div
        const app = document.createElement('div')
        container.append(app)

        // Create a root on the UI container and render a component
        const root = ReactDOM.createRoot(app)
        root.render(createElement(App, { container }))
        return root
      },
      onRemove: (root) => {
        // Unmount the root when the UI is removed
        root?.unmount()
      },
    })

    // 4. Mount the UI
    ui.mount()
  },
})
