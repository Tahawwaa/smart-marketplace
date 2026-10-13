import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { GlowCard } from '../../components/ui/glow-card'
import { cn } from '../../lib/cn'
import { faNum } from '../../lib/format'
import { statusTone } from './status-tone'
import type { Tone } from './status-tone'

const TONE_CLASSES: Record<Tone, string> = {
  cyan: 'border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-100',
  violet: 'border-violet-400/25 bg-violet-400/[0.08] text-violet-100',
  amber: 'border-amber-400/25 bg-amber-400/[0.08] text-amber-100',
  rose: 'border-rose-400/25 bg-rose-400/[0.08] text-rose-100',
  emerald: 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-100',
}

export function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-lg border px-2 py-1 text-[11px] whitespace-nowrap',
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
    <GlowCard className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-neutral-500">{label}</p>
        <span className={cn('grid size-8 place-items-center rounded-xl border', TONE_CLASSES[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-lg font-extrabold tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-neutral-500">{hint}</p> : null}
    </GlowCard>
  )
}

export function AdminPanel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function AdminLoading({ label = 'در حال بارگذاری…' }: { label?: string }) {
  return (
    <p className="flex items-center gap-2 py-6 text-sm text-neutral-400">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </p>
  )
}

export function AdminError({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-2.5 text-xs text-rose-200">
      {message}
    </p>
  )
}

export function AdminEmpty({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-white/[0.08] px-4 py-12 text-center text-xs text-neutral-500">
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
        className="min-w-52 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none transition placeholder:text-neutral-600 focus:border-white/25"
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
    return <p className="text-[11px] text-neutral-600">مجموع {faNum(total)} مورد</p>
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[11px] text-neutral-600">
        صفحه {faNum(page)} از {faNum(lastPage)} • {faNum(total)} مورد
      </span>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-white/10 px-3 py-1.5 text-neutral-300 transition hover:border-white/25 hover:text-white disabled:opacity-40"
      >
        قبلی
      </button>
      <button
        type="button"
        disabled={page >= lastPage}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-white/10 px-3 py-1.5 text-neutral-300 transition hover:border-white/25 hover:text-white disabled:opacity-40"
      >
        بعدی
      </button>
    </div>
  )
}
