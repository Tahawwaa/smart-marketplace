import { Outlet } from 'react-router-dom'
import { SiteFooter } from '../components/layout/site-footer'
import { SiteHeader } from '../components/layout/site-header'

export function MarketplaceLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-fg">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
