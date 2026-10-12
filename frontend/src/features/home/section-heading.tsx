import { motion } from 'motion/react'

export function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7 }}
      className="mx-auto mb-14 max-w-2xl text-center"
    >
      <span className="mb-4 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
        {eyebrow}
      </span>
      <h2 className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-3xl font-black leading-snug text-transparent md:text-5xl">
        {title}
      </h2>
      {text && <p className="mt-4 leading-8 text-neutral-400">{text}</p>}
    </motion.div>
  )
}
