import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/main.css'
import { HeroUIProvider, ToastProvider } from '@heroui/react'
import App from '@/App'
import MyRouter from '@/router/MyRouter'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { Toaster } from '@/components/ui/sonner'
import { formatDocumentTitle } from '@/config/site.config'

document.title = formatDocumentTitle()

const root = document.getElementById('root')!

const app = (
  <ErrorBoundary>
    <HeroUIProvider>
      <ToastProvider placement="top-center" toastOffset={68} />
      <MyRouter>
        <App />
      </MyRouter>
      <Toaster richColors position="top-center" />
    </HeroUIProvider>
  </ErrorBoundary>
)

createRoot(root).render(import.meta.env.DEV ? <StrictMode>{app}</StrictMode> : app)
