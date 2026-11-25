import { Outlet, useLocation } from 'react-router'
import TopBar from '@/components/ui-kit/TopBar'
import ErrorBoundary from '@/components/common/ErrorBoundary'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-dvh bg-app">
      <TopBar />
      <main className="mx-auto max-w-[1440px] px-4 pb-20 md:px-6">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
