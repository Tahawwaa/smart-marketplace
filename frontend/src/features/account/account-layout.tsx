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
      <p className="flex items-center justify-center gap-2 px-4 py-24 text-sm text-neutral-400">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری پنل…
      </p>
    )
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-base font-extrabold text-white">پنل کاربری</h1>
        <p className="text-xs text-neutral-500">
          خوش آمدید، <span className="text-neutral-300">{user?.name}</span>
        </p>
      </header>

      <nav className="mb-6 mt-4 flex flex-wrap gap-2 text-xs">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 rounded-xl border px-3 py-2 transition',
                isActive
                  ? 'border-white/25 bg-white/10 text-white'
                  : 'border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-white',
              )
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
