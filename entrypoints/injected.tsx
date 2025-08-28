import ReactDOM from 'react-dom/client'
import App from './content/App'
import styles from './content/style.css?inline'
import styles2 from 'sonner/dist/styles.css?inline'
import { toggle } from '@/integrations/dialog/open'

function addStyle(shadow: ShadowRoot, styles: string[]) {
  const sheets = styles.map((style) => {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(style.replaceAll(':root', ':host'))
    return sheet
  })
  shadow.adoptedStyleSheets = sheets
}

export default defineUnlistedScript(async () => {
  if (document.querySelector('idb-port-ui')) {
    toggle()
    return
  }
  const ctx = new ContentScriptContext('injeted.js')
  const ui = await createShadowRootUi(ctx, {
    name: 'idb-port-ui',
    position: 'inline',
    anchor: 'body',
    onMount: (container) => {
      const shadowEl = document.querySelector('idb-port-ui') as HTMLElement
      shadowEl.style.position = 'fixed'
      shadowEl.style.zIndex = '9999'
      const shadow = shadowEl!.shadowRoot!
      addStyle(shadow, [styles, styles2])

      // Container is a body, and React warns when creating a root on the body, so create a wrapper div
      const app = document.createElement('div')
      container.append(app)

      // Create a root on the UI container and render a component
      const root = ReactDOM.createRoot(app)
      root.render(<App container={container} />)
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
