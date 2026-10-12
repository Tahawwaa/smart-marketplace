import { animate, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

export function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, { duration: 2, ease: 'easeOut', onUpdate: (latest) => setValue(Math.round(latest)) })
    return () => controls.stop()
  }, [inView, to])

  return (
    <span ref={ref}>
      {value.toLocaleString('fa-IR')}
      {suffix}
    </span>
  )
}
