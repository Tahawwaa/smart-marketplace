import { motion } from 'motion/react'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { BackgroundBeams } from '../../components/ui/background-beams'
import { MovingBorderButton, ShimmerButton } from '../../components/ui/moving-border-button'
import { Spotlight } from '../../components/ui/spotlight'
import { TextGenerateEffect } from '../../components/ui/text-generate-effect'

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink pb-24 pt-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,68,245,0.18),transparent_55%)]" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#8b5cf6" />
      <BackgroundBeams />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-neutral-300 backdrop-blur"
        >
          <Sparkles className="size-3.5 text-fuchsia-400" />
          بازارچه چندفروشنده، با هوش مصنوعی
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-5xl font-black leading-[1.35] text-transparent sm:text-6xl md:text-7xl"
        >
          هر چیزی که می‌خواهید،
          <br />
          <span className="bg-gradient-to-l from-cyan-300 via-indigo-400 to-fuchsia-400 bg-clip-text">از بهترین فروشنده</span>
        </motion.h1>

        <TextGenerateEffect
          className="mx-auto mt-8 max-w-2xl text-base leading-8 text-neutral-400 md:text-lg"
          words="مقایسه لحظه‌ای پیشنهاد فروشندگان، رزرو هوشمند موجودی و سفارش‌های تفکیک‌شده؛ همه در یک بازار سریع و شفاف."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <MovingBorderButton href="#features">
            شروع خرید
            <ArrowLeft className="size-4" />
          </MovingBorderButton>
          <ShimmerButton href="#vendors">فروشنده شوید</ShimmerButton>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
    </section>
  )
}
