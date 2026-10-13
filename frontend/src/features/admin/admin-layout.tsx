import {
  Boxes,
  LayoutDashboard,
  ScrollText,
  Shapes,
  Store,
  Tags,
  Users,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { cn } from '../../lib/cn'

const TABS = [
  { to: '/admin', label: 'داشبورد', icon: LayoutDashboard, end: true },
  { to: '/admin/vendors', label: 'فروشگاه‌ها', icon: Store, end: false },
  { to: '/admin/products', label: 'کالاها', icon: Boxes, end: false },
  { to: '/admin/orders', label: 'سفارش‌ها', icon: ScrollText, end: false },
  { to: '/admin/users', label: 'کاربران', icon: Users, end: false },
  { to: '/admin/categories', label: 'دسته‌بندی‌ها', icon: Shapes, end: false },
  { to: '/admin/brands', label: 'برندها', icon: Tags, end: false },
]

export function AdminLayout() {
  const { user } = useAuth()

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-base font-extrabold text-white">پنل مدیریت بازار هوشمند</h1>
        <p className="text-xs text-neutral-500">
          وارد‌شده به‌عنوان <span className="text-neutral-300">{user?.name}</span>
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
