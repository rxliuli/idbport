import { PublicPath } from 'wxt/browser'

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    await browser.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ['/injeted.js' as PublicPath],
    })
  })
})
