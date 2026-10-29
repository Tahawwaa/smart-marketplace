import { ArrowUpLeft, BarChart3, Boxes, LayoutDashboard, Package, Plus, Settings2, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react'
import { Link, NavLink, Outlet, useOutletContext } from 'react-router-dom'
import type { VendorOutletContext } from '../../components/layout/require-vendor'
import { cn } from '../../lib/cn'
import { faNum } from '../../lib/format'
import { useAuth } from '../auth/auth-context'
import { VendorStatus } from './vendor-ui'

const TABS = [
  { to: '/vendor', label: 'نمای کلی', icon: LayoutDashboard, end: true },
  { to: '/vendor/products', label: 'کالاهای من', icon: Package, end: false },
  { to: '/vendor/inventory', label: 'موجودی و قیمت', icon: Boxes, end: false },
  { to: '/vendor/orders', label: 'سفارش‌ها', icon: Truck, end: false },
  { to: '/vendor/analytics', label: 'گزارش فروش', icon: BarChart3, end: false },
  { to: '/vendor/settings', label: 'تنظیمات فروشگاه', icon: Settings2, end: false },
]

export function VendorLayout() {
  const context = useOutletContext<VendorOutletContext>()
  const { vendor } = context
  const { user } = useAuth()
  return <section className="container-page py-5 sm:py-8">
    <header className="relative overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-l from-brand-soft via-surface to-surface p-5 sm:p-7">
      <div className="pointer-events-none absolute -start-16 -top-24 size-64 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-brand-fg shadow-[var(--shadow-md)]"><Store className="size-7" /></span><div className="min-w-0"><p className="mb-1.5 text-[10px] font-bold tracking-wider text-fg-subtle">مرکز فروشندگان · tahajorablo</p><h1 className="truncate text-xl font-black text-fg sm:text-2xl">{vendor.store_name}</h1><div className="mt-2 flex flex-wrap items-center gap-2"><VendorStatus status={vendor.status} /><span className="text-[11px] text-fg-subtle">کمیسیون فروش {faNum(vendor.commission_rate)}٪</span></div></div></div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto"><Link to={`/products?vendor=${encodeURIComponent(vendor.slug)}`} className="btn btn-secondary btn-sm"><ShoppingBag className="size-4" />ویترین فروشگاه<ArrowUpLeft className="size-3.5" /></Link><Link to="/vendor/products/new" className="btn btn-primary btn-sm"><Plus className="size-4" />کالای جدید</Link></div>
      </div>
    </header>
    <div className="mt-5 grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
      <aside className="min-w-0 rounded-2xl border border-line bg-surface p-2 lg:sticky lg:top-24">
        <p className="hidden px-3 pb-2 pt-3 text-[10px] font-bold text-fg-subtle lg:block">فضای کار فروشگاه</p>
        <nav aria-label="ناوبری پنل فروشنده" className="scrollbar-none flex gap-1 overflow-x-auto lg:block lg:space-y-1">{TABS.map((tab) => <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => cn('flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-3 text-xs font-bold transition', isActive ? 'bg-brand text-brand-fg shadow-[var(--shadow-sm)]' : 'text-fg-muted hover:bg-surface-2 hover:text-fg')}><tab.icon className="size-4" />{tab.label}</NavLink>)}</nav>
        <div className="mt-2 hidden space-y-3 border-t border-line p-3 lg:block"><p className="truncate text-xs font-bold text-fg">{user?.name}</p><p className="text-[11px] leading-6 text-fg-subtle">مدیریت روزانهٔ کالاها و سفارش‌های فروشگاه شما</p>{user?.role === 'admin' ? <Link to="/admin" className="flex items-center gap-2 text-xs font-bold text-brand"><ShieldCheck className="size-4" />ورود به پنل مدیریت</Link> : <Link to="/account" className="text-xs font-bold text-brand">حساب کاربری</Link>}</div>
        {user?.role === 'admin' ? <Link to="/admin" className="mt-2 flex items-center gap-2 border-t border-line p-3 text-xs font-bold text-brand lg:hidden"><ShieldCheck className="size-4" />ورود به پنل مدیریت</Link> : null}
      </aside>
      <div className="min-w-0 space-y-5">{vendor.status === 'pending' ? <p className="alert alert-warning">فروشگاه در انتظار تأیید است. می‌توانید کالاها را آماده کنید؛ فروش پس از تأیید فعال می‌شود.</p> : null}<Outlet context={context} /></div>
    </div>
  </section>
}
