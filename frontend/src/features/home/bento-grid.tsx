import { motion } from 'motion/react'
import { BadgeCheck, Boxes, Brain, Gauge, ShieldCheck, Store, TrendingDown, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { GlowCard } from '../../components/ui/glow-card'
import { cn } from '../../lib/cn'
import { Counter } from './counter'
import { SectionHeading } from './section-heading'

const OFFERS = [
  { store: 'دیجی‌پلاس', price: 41200000, tag: 'ارسال فوری', best: false },
  { store: 'تکنو‌مارکت', price: 39900000, tag: 'کمترین قیمت', best: true },
  { store: 'آوا‌کالا', price: 40500000, tag: 'گارانتی ۲۴ ماه', best: false },
]

type TileProps = {
  className?: string
  icon: ReactNode
  title: string
  text: string
  color?: string
  children?: ReactNode
  index: number
}

function Tile({ className, icon, title, text, color, children, index }: TileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <GlowCard color={color} className="h-full">
        <div className="flex h-full flex-col p-6 md:p-7">
          <div className="mb-4 grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white">{icon}</div>
          <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
          <p className="text-sm leading-7 text-neutral-400">{text}</p>
          {children && <div className="mt-6 flex-1">{children}</div>}
        </div>
      </GlowCard>
    </motion.div>
  )
}

export function BentoGrid() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-28">
      <SectionHeading
        eyebrow="امکانات"
        title="هر بخش، دقیقاً برای بازار چندفروشنده طراحی شده"
        text="از مقایسه پیشنهادها تا تسویه فروشنده؛ زیرساختی که فشار فروش بالا را هم تحمل می‌کند."
      />

      <div className="grid auto-rows-[minmax(220px,auto)] grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12">
        <Tile
          index={0}
          className="md:col-span-6 lg:col-span-7 lg:row-span-2"
          icon={<TrendingDown className="size-5 text-cyan-300" />}
          title="مقایسه زنده پیشنهاد فروشندگان"
          text="هر تنوع کالا چند پیشنهاد دارد؛ قیمت، گارانتی و زمان تحویل کنار هم دیده می‌شود."
          color="24, 204, 252"
        >
          <ul className="space-y-3">
            {OFFERS.map((offer, offerIndex) => (
              <motion.li
                key={offer.store}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + offerIndex * 0.15 }}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm',
                  offer.best ? 'border-cyan-400/40 bg-cyan-400/[0.07]' : 'border-white/[0.07] bg-white/[0.02]',
                )}
              >
                <span className="flex items-center gap-3">
                  <Store className="size-4 text-neutral-500" />
                  <span className="font-medium text-white">{offer.store}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px]', offer.best ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/[0.06] text-neutral-400')}>
                    {offer.tag}
                  </span>
                </span>
                <span className="font-bold tabular-nums text-white">{offer.price.toLocaleString('fa-IR')} تومان</span>
              </motion.li>
            ))}
          </ul>
        </Tile>

        <Tile
          index={1}
          className="md:col-span-3 lg:col-span-5"
          icon={<Brain className="size-5 text-fuchsia-300" />}
          title="توضیحات محصول با هوش مصنوعی"
          text="فروشنده نام کالا را می‌نویسد؛ متن حرفه‌ای و سئو‌شده در چند ثانیه آماده است."
          color="217, 70, 239"
        />

        <Tile
          index={2}
          className="md:col-span-3 lg:col-span-5"
          icon={<Boxes className="size-5 text-emerald-300" />}
          title="رزرو هوشمند موجودی"
          text="موجودی هنگام پرداخت رزرو می‌شود و رزروهای منقضی خودکار آزاد می‌شوند."
          color="52, 211, 153"
        />

        <Tile
          index={3}
          className="md:col-span-2 lg:col-span-4"
          icon={<Gauge className="size-5 text-amber-300" />}
          title="جست‌وجوی سریع"
          text="فیلتر روی قیمت، برند و ویژگی‌ها."
          color="251, 191, 36"
        >
          <div className="text-5xl font-black text-white">
            <Counter to={99} suffix="٪" />
          </div>
        </Tile>

        <Tile
          index={4}
          className="md:col-span-4 lg:col-span-4"
          icon={<Wallet className="size-5 text-indigo-300" />}
          title="تسویه شفاف فروشندگان"
          text="کمیسیون هر فروشنده مشخص است و تسویه به صورت دسته‌ای انجام می‌شود."
          color="99, 102, 241"
        >
          <div className="flex h-24 items-end gap-1.5">
            {[40, 65, 50, 85, 60, 95, 75].map((height, barIndex) => (
              <motion.div
                key={barIndex}
                initial={{ height: 0 }}
                whileInView={{ height: `${height}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + barIndex * 0.08, duration: 0.6 }}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-600/20 to-indigo-400"
              />
            ))}
          </div>
        </Tile>

        <Tile
          index={5}
          className="md:col-span-6 lg:col-span-4"
          icon={<ShieldCheck className="size-5 text-rose-300" />}
          title="احراز هویت امن"
          text="ورود مبتنی بر توکن و نقش‌های مشتری، فروشنده و مدیر."
          color="251, 113, 133"
        >
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <BadgeCheck className="size-4 text-emerald-400" />
            فروشندگان پس از تأیید فعال می‌شوند
          </div>
        </Tile>
      </div>
    </section>
  )
}
