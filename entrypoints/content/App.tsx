import { Toaster } from '@/components/ui/sonner'
import { IndexPage } from './IndexPage'

function App() {
  return (
    <>
      <IndexPage />
      <Toaster richColors={true} closeButton={true} />
    </>
  )
}

export default App
