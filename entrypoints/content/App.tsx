import { Toaster } from '@/components/ui/sonner'
import { IndexPage } from './IndexPage'
import { ShadowProvider } from '@/integrations/shadow/ShadowProvider'
import { ThemeProvider } from '@/integrations/theme/ThemeProvider'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

function App(props: { container: HTMLElement }) {
  const { container } = props
  return (
    <ShadowProvider container={container}>
      <ThemeProvider>
        <QueryClientProvider client={new QueryClient()}>
          <IndexPage />
          <Toaster richColors={true} closeButton={true} />
        </QueryClientProvider>
      </ThemeProvider>
    </ShadowProvider>
  )
}

export default App
