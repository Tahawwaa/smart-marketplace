import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export const inputClass =
  'input mt-1'

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
    <label className="block text-xs text-fg-muted">
      {label}
      {required ? <span className="text-danger-ink"> *</span> : null}
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-fg-subtle">{hint}</span> : null}
    </label>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <p className="alert alert-danger">
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
          ? 'border-success/30 bg-success-soft text-success-ink'
          : 'border-warning/30 bg-warning-soft text-warning-ink',
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
      className="btn btn-primary"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
    </button>
  )
}
