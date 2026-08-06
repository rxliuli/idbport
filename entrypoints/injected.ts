import ReactDOM from 'react-dom/client'
import App from './content/App'
import styles from './content/style.css?inline'
import styles2 from 'sonner/dist/styles.css?inline'
import { toggle } from '@/integrations/dialog/open'
import { createElement } from 'react'

function addStyle(shadow: ShadowRoot, styles: string[]) {
  const css = styles.join('\n').replaceAll(':root', ':host')

  // Extract @property declarations and hoist to document head,
  // because @property doesn't work inside Shadow DOM <style> elements.
  // https://github.com/tailwindlabs/tailwindcss/issues/15005
  const propertyRules: string[] = []
  const shadowCss = css.replace(/@property\s+[^{]+\{[^}]*\}/g, (match) => {
    propertyRules.push(match)
    return ''
  })
  if (propertyRules.length > 0) {
    const propStyle = document.createElement('style')
    propStyle.textContent = propertyRules.join('\n')
    document.head.appendChild(propStyle)
  }

  const style = document.createElement('style')
  style.textContent = shadowCss
  if (shadow.firstChild) {
    shadow.insertBefore(style, shadow.firstChild)
  } else {
    shadow.appendChild(style)
  }
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
      container.style.position = 'fixed'
      container.style.zIndex = '9999'
      const shadow = shadowEl!.shadowRoot!
      addStyle(shadow, [styles, styles2])

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
})
