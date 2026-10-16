import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { GlowCard } from '../../components/ui/glow-card'
import { cn } from '../../lib/cn'
import { faNum } from '../../lib/format'
import { statusTone } from './status-tone'
import type { Tone } from './status-tone'

const TONE_CLASSES: Record<Tone, string> = {
  cyan: 'border-info/30 bg-info-soft text-info-ink',
  violet: 'border-brand/30 bg-brand-soft text-brand-ink',
  amber: 'border-warning/30 bg-warning-soft text-warning-ink',
  rose: 'border-danger/30 bg-danger-soft text-danger-ink',
  emerald: 'border-success/30 bg-success-soft text-success-ink',
}

export function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap',
        TONE_CLASSES[statusTone(status)],
      )}
    >
      {label}
    </span>
  )
}

type StatCardProps = {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: Tone
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'violet' }: StatCardProps) {
  return (
    <GlowCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-fg-subtle">{label}</p>
        <span className={cn('grid size-9 place-items-center rounded-xl border', TONE_CLASSES[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tabular-nums text-fg">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-fg-subtle">{hint}</p> : null}
    </GlowCard>
  )
}

export function AdminPanel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="section-title text-sm">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function AdminLoading({ label = 'در حال بارگذاری…' }: { label?: string }) {
  return (
    <p className="flex items-center gap-2 py-6 text-sm text-fg-muted">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </p>
  )
}

export function AdminError({ message }: { message: string }) {
  return (
    <p className="alert alert-danger">
      {message}
    </p>
  )
}

export function AdminEmpty({ message }: { message: string }) {
  return (
    <p className="card px-4 py-12 text-center text-xs text-fg-subtle">
      {message}
    </p>
  )
}

type ToolbarProps = {
  search: string
  onSearch: (value: string) => void
  placeholder: string
  children?: ReactNode
}

export function AdminToolbar({ search, onSearch, placeholder, children }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <input
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={placeholder}
        className="input max-w-xs"
      />
      {children}
    </div>
  )
}

/** شمارنده‌ی صفحه‌بندی؛ فقط وقتی سرور متادیتا فرستاده باشد رندر می‌شود. */
export function Pager({
  page,
  lastPage,
  total,
  onChange,
}: {
  page: number
  lastPage: number
  total: number
  onChange: (page: number) => void
}) {
  if (lastPage <= 1) {
    return <p className="text-[11px] text-fg-subtle">مجموع {faNum(total)} مورد</p>
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[11px] text-fg-subtle">
        صفحه {faNum(page)} از {faNum(lastPage)} • {faNum(total)} مورد
      </span>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="btn btn-secondary btn-sm"
      >
        قبلی
      </button>
      <button
        type="button"
        disabled={page >= lastPage}
        onClick={() => onChange(page + 1)}
        className="btn btn-secondary btn-sm"
      >
        بعدی
      </button>
    </div>
  )
}
