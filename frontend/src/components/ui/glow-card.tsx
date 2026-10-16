import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  children: ReactNode
  className?: string
  color?: string
}

export function GlowCard({ children, className, color = '79, 70, 229' }: Props) {
  return (
    <div
      style={{ '--glow': color } as React.CSSProperties}
      className={cn(
        'group relative overflow-hidden card shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-md)]',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: 'linear-gradient(90deg, transparent, rgb(var(--glow)), transparent)' }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
}
