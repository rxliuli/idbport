import { PublicPath } from 'wxt/browser'

export default defineBackground(() => {
  // browser.runtime.onInstalled.addListener(async () => {
  //   await browser.tabs.create({
  //     active: true,
  //     url: 'https://rxliuli.com/projects/idbport',
  //   })
  // })
  browser.action.onClicked.addListener(async (tab) => {
    const [script] = await browser.scripting.executeScript({
      target: { tabId: tab.id! },
      world: 'MAIN',
      func: () => {
        if (document.querySelector('idb-port-ui')) {
          return true
        }
        return false
      },
    })
    if (script.result) {
      browser.scripting.executeScript({
        target: { tabId: tab.id! },
        world: 'MAIN',
        func: () => {
          document.dispatchEvent(new CustomEvent('dialog:toggle'))
        },
      })
    } else {
      await browser.scripting.executeScript({
        target: { tabId: tab.id! },
        world: 'MAIN',
        files: ['/injected.js' as PublicPath],
      })
    }
  })
})
