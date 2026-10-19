import { motion } from 'motion/react'
import { Heart, Package, ShoppingBag, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlowCard } from '../../components/ui/glow-card'
import { cn } from '../../lib/cn'
import { faNum, faPercent, faPrice } from '../../lib/format'
import { CATEGORIES } from '../home/data'
import { RemoteImage } from '../../components/ui/remote-image'

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
  imageSources?: string[]
}

const accentOf = (slug: string) => {
  const category = CATEGORIES.find((item) => item.slug === slug)
  return {
    color: category?.color ?? '79, 70, 229',
    tint: category?.tint ?? 'text-brand',
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
      <GlowCard color={color} className="group h-full card-hover">
        <div className="relative flex h-full flex-col">
          <div
            className="relative grid aspect-square place-items-center overflow-hidden"
            style={{
              backgroundImage: `radial-gradient(90% 90% at 50% 40%, var(--surface) 0%, transparent 70%), linear-gradient(180deg, rgba(${color}, 0.07), rgba(${color}, 0.14))`,
            }}
          >
            <RemoteImage
              src={product.imageUrl ? [product.imageUrl] : (product.imageSources ?? [])}
              alt={product.name}
              className="size-full object-contain p-6 drop-shadow-[0_16px_18px_rgba(15,23,42,0.2)] transition duration-500 ease-out group-hover:scale-105"
              fallback={
                <div className="relative grid size-24 place-items-center rounded-3xl border border-white/40 bg-surface/70 shadow-[var(--shadow-md)] backdrop-blur">
                  <Icon aria-hidden className={cn('size-12 opacity-80', tint)} />
                </div>
              }
            />

            {discount && (
              <span className="badge badge-accent absolute start-3 top-3 shadow-[var(--shadow-sm)]">
                {discount} تخفیف
              </span>
            )}

            <button
              type="button"
              aria-label="افزودن به علاقه‌مندی‌ها"
              className="btn btn-icon absolute end-3 top-3 z-10 size-9 min-h-0 border-line bg-surface/90 text-fg-muted backdrop-blur transition hover:border-danger hover:text-danger focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <Heart className="size-4" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-1 p-4">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className={cn('truncate font-bold', tint)}>{product.categoryName}</span>
              {product.rating ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 font-bold text-warning-ink">
                  <Star className="size-3 fill-current" />
                  {faNum(product.rating)}
                </span>
              ) : null}
            </div>

            <h3 className="mt-1 line-clamp-2 min-h-12 text-sm font-bold leading-6 text-fg">
              {product.slug ? (
                <Link
                  to={`/products/${product.slug}`}
                  className="transition hover:text-brand after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                >
                  {product.name}
                </Link>
              ) : (
                product.name
              )}
            </h3>

            <p className="flex items-center gap-1.5 text-[11px] text-fg-subtle">
              {product.brandName ? <span className="font-semibold">{product.brandName}</span> : null}
              {product.brandName && product.sold ? <span aria-hidden>•</span> : null}
              {product.sold ? <span>{faNum(product.sold)} فروش</span> : null}
            </p>

            <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
              <div className="min-w-0">
                {product.oldPrice ? (
                  <span className="block text-[11px] text-fg-subtle line-through tabular-nums">
                    {faNum(product.oldPrice)}
                  </span>
                ) : null}
                <span className="block text-base font-black leading-6 tabular-nums text-fg">
                  {product.price === null ? 'قیمت پس از انتخاب تنوع' : faPrice(product.price)}
                </span>
              </div>

              <button
                type="button"
                disabled={!product.slug}
                aria-label={product.slug ? `افزودن ${product.name} به سبد خرید` : 'نمایش نمونه'}
                onClick={() => onAdd?.(product)}
                className="btn btn-primary btn-icon relative z-10 size-10 min-h-0 shrink-0 disabled:cursor-default disabled:bg-surface-2 disabled:text-fg-muted disabled:shadow-none"
              >
                <ShoppingBag className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </GlowCard>
    </motion.article>
  )
}
