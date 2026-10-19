import { Loader2, Lock, MapPin, ShoppingBag, Store, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { cn } from '../../lib/cn'

const TABS = [
  { to: '/account', label: 'خلاصه', icon: UserRound, end: true },
  { to: '/account/orders', label: 'سفارش‌های من', icon: ShoppingBag, end: false },
  { to: '/account/addresses', label: 'نشانی‌ها', icon: MapPin, end: false },
  { to: '/account/password', label: 'امنیت', icon: Lock, end: false },
  { to: '/account/store', label: 'فروشندگی', icon: Store, end: false },
]

export function AccountLayout() {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <p className="flex items-center justify-center gap-2 px-4 py-24 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری پنل…
      </p>
    )
  }

  return (
    <section className="container-page max-w-4xl py-6 sm:py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="page-title">پنل کاربری</h1>
        <p className="text-xs text-fg-subtle">
          خوش آمدید، <span className="text-fg-muted">{user?.name}</span>
        </p>
      </header>

      <nav className="scrollbar-none -mx-4 mb-5 mt-4 flex gap-2 overflow-x-auto px-4 text-xs sm:mx-0 sm:mb-6 sm:flex-wrap sm:px-0">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn('chip', isActive && 'border-brand bg-brand text-brand-fg hover:text-brand-fg')
            }
          >
            <tab.icon className="size-4" />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </section>
  )
}
