import { motion } from 'motion/react'
import { Heart, Package, ShoppingBag, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlowCard } from '../../components/ui/glow-card'
import { cn } from '../../lib/cn'
import { faNum, faPercent, faPrice } from '../../lib/format'
import { CATEGORIES } from '../home/data'

export type ProductCardData = {
  id: number
  slug?: string
  name: string
  categorySlug: string
  categoryName: string
  brandName?: string
  price: number | null
  oldPrice?: number
  rating?: number
  sold?: number
  imageUrl?: string | null
}

const accentOf = (slug: string) => {
  const category = CATEGORIES.find((item) => item.slug === slug)
  return {
    color: category?.color ?? '139, 92, 246',
    tint: category?.tint ?? 'text-indigo-300',
    icon: category?.icon ?? Package,
  }
}

type Props = {
  product: ProductCardData
  index?: number
  onAdd?: (product: ProductCardData) => void
}

export function ProductCard({ product, index = 0, onAdd }: Props) {
  const { color, tint, icon: Icon } = accentOf(product.categorySlug)
  const discount =
    product.price !== null && product.oldPrice ? faPercent(product.price, product.oldPrice) : null

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index, 7) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <GlowCard className="h-full border-white/[0.07]">
        <div className="flex h-full flex-col">
          <div
            className="relative grid h-40 place-items-center overflow-hidden rounded-t-3xl border-b border-white/[0.06]"
            style={{
              backgroundImage: `radial-gradient(120% 120% at 20% 0%, rgba(${color}, 0.26), transparent 62%), linear-gradient(165deg, rgba(17,17,24,1), rgba(6,6,9,1))`,
            }}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                className="size-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <Icon
                aria-hidden
                className={cn('size-16 opacity-70 transition duration-500 group-hover:scale-110', tint)}
              />
            )}

            <div className="absolute start-2.5 top-2.5 flex flex-col items-start gap-1.5">
              {discount && (
                <span className="rounded-lg bg-rose-500 px-2 py-1 text-[10px] font-bold text-white">
                  {discount} تخفیف
                </span>
              )}
              {product.brandName && (
                <span className="rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[10px] text-neutral-300 backdrop-blur">
                  {product.brandName}
                </span>
              )}
            </div>

            <button
              type="button"
              aria-label="افزودن به علاقه‌مندی‌ها"
              className="absolute end-2.5 top-2.5 grid size-8 place-items-center rounded-lg border border-white/10 bg-black/40 text-neutral-400 opacity-0 backdrop-blur transition group-hover:opacity-100 hover:text-rose-400 focus-visible:opacity-100"
            >
              <Heart className="size-4" />
            </button>
          </div>

          <div className="flex flex-1 flex-col p-4">
            <span className={cn('mb-1.5 text-[11px] font-medium', tint)}>{product.categoryName}</span>
            <h3 className="line-clamp-2 text-sm font-bold leading-6 text-white">
              {product.slug ? (
                <Link to={`/products/${product.slug}`} className="transition hover:text-cyan-200">
                  {product.name}
                </Link>
              ) : (
                product.name
              )}
            </h3>

            <div className="mb-3 mt-2 flex items-center gap-2 text-[11px] text-neutral-500">
              {product.rating ? (
                <span className="flex items-center gap-1 text-amber-300">
                  <Star className="size-3.5 fill-current" />
                  {faNum(product.rating)}
                </span>
              ) : null}
              {product.rating && product.sold ? <span className="text-neutral-700">•</span> : null}
              {product.sold ? <span>{faNum(product.sold)} فروش</span> : null}
            </div>

            <div className="mt-auto space-y-2.5">
              <div className="flex items-baseline gap-2">
                {product.oldPrice ? (
                  <span className="text-[11px] text-neutral-600 line-through tabular-nums">
                    {faNum(product.oldPrice)}
                  </span>
                ) : null}
                <span className="text-sm font-bold tabular-nums text-white">
                  {product.price === null ? 'قیمت پس از انتخاب تنوع' : faPrice(product.price)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onAdd?.(product)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] py-2 text-xs font-bold text-neutral-200 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
              >
                <ShoppingBag className="size-3.5" />
                افزودن به سبد
              </button>
            </div>
          </div>
        </div>
      </GlowCard>
    </motion.article>
  )
}
