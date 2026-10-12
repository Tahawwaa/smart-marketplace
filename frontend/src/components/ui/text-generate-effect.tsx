import { motion, stagger, useAnimate, useInView } from 'motion/react'
import { useEffect } from 'react'
import { cn } from '../../lib/cn'

export function TextGenerateEffect({ words, className }: { words: string; className?: string }) {
  const [scope, animate] = useAnimate()
  const inView = useInView(scope, { once: true })

  useEffect(() => {
    if (inView) {
      animate('span', { opacity: 1, filter: 'blur(0px)' }, { duration: 0.8, delay: stagger(0.08) })
    }
  }, [inView, animate])

  return (
    <motion.p ref={scope} className={className}>
      {words.split(' ').map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className={cn('inline-block opacity-0')}
          style={{ filter: 'blur(10px)' }}
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </motion.p>
  )
}
