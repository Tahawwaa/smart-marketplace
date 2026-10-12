import { motion, useMotionTemplate, useMotionValue } from 'motion/react'
import type { MouseEvent, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  children: ReactNode
  className?: string
  color?: string
}

export function GlowCard({ children, className, color = '139, 92, 246' }: Props) {
  const mouseX = useMotionValue(-300)
  const mouseY = useMotionValue(-300)
  const background = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, rgba(${color}, 0.18), transparent 80%)`
  const border = useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, rgba(${color}, 0.7), transparent 80%)`

  function handleMove({ currentTarget, clientX, clientY }: MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      onMouseMove={handleMove}
      className={cn('group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-neutral-950', className)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl p-px opacity-0 transition duration-300 group-hover:opacity-100 [mask-composite:exclude] [mask-image:linear-gradient(#000_0_0),linear-gradient(#000_0_0)] [mask-clip:content-box,border-box]"
        style={{ background: border }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
}
