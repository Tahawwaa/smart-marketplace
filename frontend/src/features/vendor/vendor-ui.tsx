import { ArrowLeft, Inbox, Loader2, RefreshCw, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { faNum, faPrice } from '../../lib/format'
import { subOrderStatusLabel, vendorStatusLabel, type VendorAnalytics } from './api'
import { useState } from 'react'

export function VendorPageHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-black text-fg">{title}</h2><p className="mt-2 text-xs leading-6 text-fg-muted">{description}</p></div>{action}</div>
}

export function VendorLoading() {
  return <div role="status" className="card flex min-h-52 items-center justify-center gap-3 text-sm text-fg-muted"><Loader2 className="size-5 animate-spin text-brand" />در حال دریافت اطلاعات فروشگاه…</div>
}

export function VendorError({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="card space-y-4 p-6 text-center"><p className="text-sm text-danger-ink">{message}</p><button type="button" onClick={retry} className="btn btn-secondary btn-sm"><RefreshCw className="size-4" />تلاش دوباره</button></div>
}

export function VendorEmpty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="card flex flex-col items-center px-5 py-14 text-center"><span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand"><Inbox className="size-6" /></span><h3 className="text-sm font-bold text-fg">{title}</h3><p className="mb-5 mt-2 max-w-sm text-xs leading-6 text-fg-muted">{description}</p>{action}</div>
}

export function VendorStatus({ status, order = false }: { status: string; order?: boolean }) {
  const tone = ['approved', 'delivered', 'paid'].includes(status) ? 'border-success/20 bg-success-soft text-success-ink'
    : ['rejected', 'suspended', 'cancelled', 'failed'].includes(status) ? 'border-danger/20 bg-danger-soft text-danger-ink'
      : ['pending', 'processing'].includes(status) ? 'border-warning/20 bg-warning-soft text-warning-ink' : 'border-line bg-surface-2 text-fg-muted'
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold whitespace-nowrap', tone)}><span className="size-1.5 rounded-full bg-current" />{order ? subOrderStatusLabel(status) : vendorStatusLabel(status)}</span>
}

export function VendorSearch({ value, placeholder = 'جست‌وجو…' }: { value: string; placeholder?: string }) {
  return <label className="flex min-w-44 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3"><Search className="size-4 shrink-0 text-fg-subtle" /><input key={value} name="search" defaultValue={value} placeholder={placeholder} aria-label={placeholder} maxLength={100} className="min-w-0 flex-1 bg-transparent py-3 text-xs text-fg outline-none" /></label>
}

export function VendorSectionLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">{children}<ArrowLeft className="size-3.5" /></Link>
}

export function SalesChart({ daily }: { daily: VendorAnalytics['daily'] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const peak = Math.max(...daily.map((day) => day.revenue), 1)
  const active = daily.find((day) => day.date === selected) ?? daily.at(-1)
  const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
  return <div className="card p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-fg">روند فروش</h3><p className="mt-1 text-[11px] text-fg-subtle">فروش پرداخت‌شده، به تومان</p></div><div aria-live="polite" className="text-end text-xs"><p className="font-bold text-fg">{faPrice(active?.revenue ?? 0)}</p><p className="mt-1 text-fg-subtle">{active ? dateLabel(active.date) : '—'} · {faNum(active?.orders ?? 0)} سفارش</p></div></div>
    <div className="relative mt-6 h-48 border-b border-line" dir="ltr"><div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between"><div className="border-t border-dashed border-line" /><div className="border-t border-dashed border-line" /><div className="border-t border-dashed border-line" /><div /></div>
      <div className="absolute inset-0 flex items-end gap-1 pt-4" role="group" aria-label="فروش هر روز؛ برای جزئیات یک روز را انتخاب کنید">{daily.map((day) => <button key={day.date} type="button" onClick={() => setSelected(day.date)} onFocus={() => setSelected(day.date)} title={`${dateLabel(day.date)}: ${faPrice(day.revenue)}`} aria-label={`${dateLabel(day.date)}، ${faPrice(day.revenue)}، ${faNum(day.orders)} سفارش`} aria-pressed={active?.date === day.date} style={{ height: `${Math.max(day.revenue / peak * 100, 2)}%` }} className={cn('z-10 min-w-0 flex-1 rounded-t-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand', active?.date === day.date ? 'bg-brand' : day.revenue > 0 ? 'bg-brand/35 hover:bg-brand/65' : 'bg-surface-3')} />)}</div>
    </div><div className="mt-3 flex justify-between text-[10px] text-fg-subtle" dir="ltr"><span>{daily[0] ? dateLabel(daily[0].date) : ''}</span><span>{daily.at(-1) ? dateLabel(daily.at(-1)!.date) : ''}</span></div>
    {daily.every((day) => day.revenue === 0) ? <p className="mt-4 text-center text-xs text-fg-subtle">در این بازه هنوز فروش پرداخت‌شده‌ای ثبت نشده است.</p> : null}
  </div>
}
