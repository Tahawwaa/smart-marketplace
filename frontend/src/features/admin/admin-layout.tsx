import {
  ArrowUpLeft,
  Boxes,
  CircleUserRound,
  Home,
  LayoutDashboard,
  ScrollText,
  Shapes,
  Store,
  Tags,
  Users,
} from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
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
    <section className="container-page py-6 sm:py-8">
      <header className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft via-surface to-accent-soft p-4 shadow-[var(--shadow-md)] sm:rounded-[1.75rem] sm:p-7">
        <div className="pointer-events-none absolute -end-16 -top-20 size-56 rounded-full bg-brand/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 start-1/3 size-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4 sm:gap-5">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-fg-subtle">
              <Link to="/" className="inline-flex items-center gap-1 transition hover:text-fg">
                <Home className="size-3.5" />
                فروشگاه
              </Link>
              <ArrowUpLeft className="size-3.5" />
              <span className="text-brand-ink">مرکز مدیریت</span>
            </div>
            <p className="eyebrow">مرکز کنترل بازار هوشمند</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-fg sm:text-3xl">
              سلام، {user?.name ?? 'مدیر'}
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-7 text-fg-muted sm:text-sm">
              وضعیت فروشگاه، سفارش‌ها و عملکرد فروشندگان را از یکجا مدیریت کنید.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-2xl border border-line bg-surface/75 px-3 py-2.5 backdrop-blur sm:flex">
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-fg">
              <CircleUserRound className="size-5" />
            </span>
            <span>
              <span className="block text-[10px] text-fg-subtle">حساب مدیریتی</span>
              <span className="block max-w-40 truncate text-xs font-bold text-fg">{user?.name}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <aside className="panel-muted min-w-0 p-2 lg:sticky lg:top-24">
          <div className="hidden px-3 py-2 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">مدیریت سامانه</p>
          </div>
          <nav aria-label="ناوبری پنل مدیریت" className="scrollbar-none flex gap-1 overflow-x-auto lg:block lg:space-y-1">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'group flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition lg:w-full',
                    isActive
                      ? 'bg-brand text-brand-fg shadow-[var(--shadow-sm)]'
                      : 'text-fg-muted hover:bg-surface hover:text-fg',
                  )
                }
              >
                <tab.icon className="size-4 shrink-0" />
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <Link
            to={user?.store ? '/vendor' : '/account/store'}
            className="mt-2 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand-soft px-3 py-2.5 text-xs font-bold text-brand-ink transition hover:bg-surface"
          >
            <Store className="size-4" />
            پنل فروشندگی من
          </Link>
          <Link
            to="/"
            className="mt-2 hidden items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-fg-subtle transition hover:bg-surface hover:text-fg lg:flex"
          >
            <ArrowUpLeft className="size-4" />
            بازگشت به فروشگاه
          </Link>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </section>
  )
}
