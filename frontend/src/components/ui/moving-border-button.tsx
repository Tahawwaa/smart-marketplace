import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  children: ReactNode
  href?: string
  className?: string
}

export function MovingBorderButton({ children, href = '#', className }: Props) {
  return (
    <a
      href={href}
      className={cn('group relative inline-flex h-12 overflow-hidden rounded-full p-px', className)}
    >
      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#18CCFC_0%,#6344F5_35%,#AE48FF_60%,#050507_100%)]" />
      <span className="relative inline-flex h-full w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-7 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover:bg-neutral-900">
        {children}
      </span>
    </a>
  )
}

export function ShimmerButton({ children, href = '#', className }: Props) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex h-12 animate-shimmer items-center justify-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(110deg,#0b0b10,45%,#2a2540,55%,#0b0b10)] bg-[length:200%_100%] px-7 text-sm font-medium text-neutral-300 transition-colors hover:text-white',
        className,
      )}
    >
      {children}
    </a>
  )
}
