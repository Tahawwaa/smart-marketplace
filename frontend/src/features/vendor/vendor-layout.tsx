import { NavLink, Outlet, useOutletContext } from 'react-router-dom'
import type { VendorOutletContext } from '../../components/layout/require-vendor'
import { cn } from '../../lib/cn'
import { faNum } from '../../lib/format'
import { vendorStatusLabel } from './api'

const TABS = [
  { to: '/vendor', label: 'خلاصه', end: true },
  { to: '/vendor/analytics', label: 'گزارش فروش', end: false },
  { to: '/vendor/products', label: 'کالاها', end: false },
  { to: '/vendor/inventory', label: 'موجودی و قیمت', end: false },
  { to: '/vendor/orders', label: 'سفارش‌ها', end: false },
]

export function VendorLayout() {
  const { vendor } = useOutletContext<VendorOutletContext>()

  return (
    <section className="container-page max-w-4xl py-6 sm:py-8">
      <h1 className="page-title">{vendor.store_name}</h1>
      <p className="mt-1 text-xs text-fg-subtle">
        وضعیت فروشگاه: {vendorStatusLabel(vendor.status)} • کمیسیون:{' '}
        <span className="tabular-nums">{faNum(vendor.commission_rate)}٪</span>
      </p>

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
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* context را دوباره پاس می‌دهیم تا صفحه‌های فرزند هم به پروفایل فروشگاه دسترسی داشته باشند. */}
      <Outlet context={{ vendor } satisfies VendorOutletContext} />
    </section>
  )
}
