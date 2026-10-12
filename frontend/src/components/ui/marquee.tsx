import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Marquee({ children, reverse = false, className }: { children: ReactNode; reverse?: boolean; className?: string }) {
  return (
    <div
      dir="ltr"
      className={cn('group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]', className)}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className={cn(
            'flex min-w-full shrink-0 animate-[marquee-scroll_40s_linear_infinite] items-center justify-around gap-6 pr-6 group-hover:[animation-play-state:paused]',
            reverse && '[animation-direction:reverse]',
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
