import { Outlet } from 'react-router-dom'
import { SiteFooter } from '../components/layout/site-footer'
import { SiteHeader } from '../components/layout/site-header'

export function MarketplaceLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ink font-sans text-neutral-200">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
