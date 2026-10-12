import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Plus, Quote, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Marquee } from '../../components/ui/marquee'
import { MovingBorderButton } from '../../components/ui/moving-border-button'
import { Spotlight } from '../../components/ui/spotlight'
import { BRANDS, FAQ, REVIEWS, STATS, STEPS } from './data'
import { Counter } from './counter'
import { SectionHeading } from './section-heading'

export function BrandStrip() {
  return (
    <section aria-label="برندها" className="border-y border-white/[0.06] bg-white/[0.015] py-8">
      <Marquee>
        {BRANDS.map((brand) => (
          <span key={brand} className="whitespace-nowrap text-xl font-extrabold text-neutral-600 transition hover:text-neutral-300">
            {brand}
          </span>
        ))}
      </Marquee>
    </section>
  )
}

export function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-24">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-ink p-8 text-center">
            <div className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
              <Counter to={stat.value} suffix={stat.suffix} />
            </div>
            <div className="mt-2 text-sm text-neutral-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading eyebrow="نحوه کار" title="از ثبت کالا تا درب خانه، در سه قدم" />
      <div className="relative grid gap-6 md:grid-cols-3">
        <div aria-hidden className="absolute inset-x-[16%] top-10 hidden h-px bg-gradient-to-l from-transparent via-indigo-500/60 to-transparent md:block" />
        {STEPS.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: index * 0.15, duration: 0.6 }}
            className="relative rounded-3xl border border-white/[0.08] bg-neutral-950 p-7 text-center"
          >
            <motion.div
              whileHover={{ rotate: 8, scale: 1.1 }}
              className="relative mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/20 via-indigo-500/20 to-fuchsia-500/20 ring-1 ring-white/15"
            >
              <step.icon className="size-6 text-white" />
              <span className="absolute -end-2 -top-2 grid size-6 place-items-center rounded-full bg-white text-xs font-black text-black">
                {(index + 1).toLocaleString('fa-IR')}
              </span>
            </motion.div>
            <h3 className="mb-2 font-bold text-white">{step.title}</h3>
            <p className="text-sm leading-7 text-neutral-400">{step.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export function VendorBanner() {
  return (
    <section id="vendors" className="mx-auto max-w-6xl px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950 px-8 py-16 md:px-16"
      >
        <Spotlight className="-top-40 left-0 md:-top-20" fill="#18CCFC" />
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-black leading-snug text-white md:text-4xl">فروشنده‌اید؟ غرفه‌تان را امروز راه بیندازید.</h2>
          <p className="mt-4 leading-8 text-neutral-400">
            محصول ثبت کنید، قیمت و موجودی را خودتان کنترل کنید و با کمیسیون شفاف، فروش را شروع کنید.
          </p>
        </div>
      </motion.div>
    </section>
  )
}

export function Reviews() {
  return (
    <section id="reviews" className="py-24">
      <SectionHeading eyebrow="نظرات" title="آنچه کاربران می‌گویند" />
      <div className="space-y-5">
        {[REVIEWS.slice(0, 3), REVIEWS.slice(3)].map((row, rowIndex) => (
          <Marquee key={rowIndex} reverse={rowIndex === 1}>
            {row.map((review) => (
              <figure key={review.name} dir="rtl" className="w-80 shrink-0 rounded-3xl border border-white/[0.08] bg-neutral-950 p-6">
                <Quote className="mb-3 size-5 text-indigo-400" />
                <blockquote className="text-sm leading-7 text-neutral-300">{review.text}</blockquote>
                <figcaption className="mt-5 text-xs">
                  <span className="font-bold text-white">{review.name}</span>
                  <span className="text-neutral-500"> — {review.role}</span>
                </figcaption>
              </figure>
            ))}
          </Marquee>
        ))}
      </div>
    </section>
  )
}

export function Faq() {
  const [active, setActive] = useState<number | null>(0)

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <SectionHeading eyebrow="سوالات متداول" title="پاسخ پرسش‌های رایج" />
      <div className="space-y-3">
        {FAQ.map((item, index) => {
          const open = active === index
          return (
            <div key={item.q} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-950">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setActive(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start font-medium text-white"
              >
                {item.q}
                <motion.span animate={{ rotate: open ? 45 : 0 }} className="shrink-0 text-indigo-400">
                  <Plus className="size-5" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="px-6 pb-5 text-sm leading-7 text-neutral-400">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section id="cta" className="relative overflow-hidden px-6 py-32 text-center">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,68,245,0.25),transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-2xl"
      >
        <h2 className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-4xl font-black leading-snug text-transparent md:text-6xl">
          آماده‌اید بازار را متفاوت تجربه کنید؟
        </h2>
        <div className="mt-10 flex justify-center">
          <MovingBorderButton href="#top">
            ساخت حساب رایگان
            <ArrowLeft className="size-4" />
          </MovingBorderButton>
        </div>
      </motion.div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-neutral-500">
        <span className="flex items-center gap-2 font-bold text-neutral-300">
          <ShoppingBag className="size-4" />
          بازار هوشمند
        </span>
        <span>© {new Date().getFullYear().toLocaleString('fa-IR', { useGrouping: false })} تمامی حقوق محفوظ است.</span>
      </div>
    </footer>
  )
}
