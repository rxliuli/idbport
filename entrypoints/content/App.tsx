import { Toaster } from '@/components/ui/sonner'
import { IndexPage } from './IndexPage'
import { ShadowProvider } from '@/integrations/shadow/ShadowProvider'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

function App(props: { container: HTMLElement }) {
  const { container } = props
  return (
    <ShadowProvider container={container}>
      <QueryClientProvider client={new QueryClient()}>
        <IndexPage />
        <Toaster richColors={true} closeButton={true} />
      </QueryClientProvider>
    </ShadowProvider>
  )
}

export default App
