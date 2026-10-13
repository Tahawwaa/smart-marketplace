import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export const inputClass =
  'mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-white/25 disabled:opacity-50'

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block text-xs text-neutral-400">
      {label}
      {required ? <span className="text-rose-300"> *</span> : null}
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-neutral-500">{hint}</span> : null}
    </label>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <p className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-2.5 text-xs text-rose-200">
      {message}
    </p>
  )
}

export function FormNotice({ message, tone = 'emerald' }: { message: string; tone?: 'emerald' | 'amber' }) {
  return (
    <p
      className={cn(
        'rounded-xl border px-4 py-2.5 text-xs',
        tone === 'emerald'
          ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200'
          : 'border-amber-400/20 bg-amber-400/[0.06] text-amber-100',
      )}
    >
      {message}
    </p>
  )
}

export function SubmitButton({
  label,
  busy,
  onClick,
}: {
  label: string
  busy: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
    </button>
  )
}
