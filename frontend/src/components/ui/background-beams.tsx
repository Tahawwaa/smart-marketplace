import { motion } from 'motion/react'
import { cn } from '../../lib/cn'

const BEAMS = Array.from({ length: 22 }, (_, index) => {
  const offset = index * 14
  return {
    id: index,
    path: `M-${380 - offset} -${189 + index * 7}C-${380 - offset} -${189 + index * 7} -${312 - offset} ${216 - index * 5} ${152 - offset} ${343 - index * 4}C${616 - offset} ${470 - index * 3} ${684 - offset * 0.6} ${875 - index * 3} ${684 - offset * 0.6} ${875 - index * 3}`,
    duration: 8 + (index % 7) * 1.7,
    delay: (index % 5) * 0.9,
  }
})

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]', className)}
    >
      <svg
        className="absolute h-full w-full"
        viewBox="0 0 696 316"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(340 60) scale(1.6)">
          {BEAMS.map((beam) => (
            <path key={`base-${beam.id}`} d={beam.path} stroke="rgb(139 92 246)" strokeOpacity="0.1" strokeWidth="0.5" />
          ))}
          {BEAMS.map((beam) => (
            <path
              key={`glow-${beam.id}`}
              d={beam.path}
              stroke={`url(#beam-${beam.id})`}
              strokeWidth="0.7"
            />
          ))}
        </g>
        <defs>
          {BEAMS.map((beam) => (
            <motion.linearGradient
              key={beam.id}
              id={`beam-${beam.id}`}
              gradientUnits="userSpaceOnUse"
              initial={{ x1: '0%', x2: '0%', y1: '0%', y2: '0%' }}
              animate={{ x1: ['0%', '100%'], x2: ['0%', '95%'], y1: ['0%', '100%'], y2: ['0%', `${93 + (beam.id % 8)}%`] }}
              transition={{ duration: beam.duration, delay: beam.delay, repeat: Infinity, ease: 'easeInOut' }}
            >
              <stop stopColor="#18CCFC" stopOpacity="0" />
              <stop stopColor="#18CCFC" />
              <stop offset="32.5%" stopColor="#6344F5" />
              <stop offset="100%" stopColor="#AE48FF" stopOpacity="0" />
            </motion.linearGradient>
          ))}
        </defs>
      </svg>
    </div>
  )
}
