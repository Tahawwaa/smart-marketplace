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
    <section className="container-page py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="page-title">پنل مدیریت بازار هوشمند</h1>
        <p className="text-xs text-fg-subtle">
          وارد‌شده به‌عنوان <span className="text-fg-muted">{user?.name}</span>
        </p>
      </header>

      <nav className="mb-6 mt-4 flex flex-wrap gap-2 text-xs">
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
