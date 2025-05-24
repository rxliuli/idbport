import { useReducer } from 'react'

const EVENT_NAME = 'dialog:toggle'

export function useOpen() {
  const [open, toggle] = useReducer((val) => !val, true)
  useEffect(() => {
    document.addEventListener(EVENT_NAME, () => toggle())
    return () => {
      document.removeEventListener(EVENT_NAME, () => toggle())
    }
  }, [])
  return { open, toggle }
}

export function toggle() {
  document.dispatchEvent(new CustomEvent(EVENT_NAME))
}
