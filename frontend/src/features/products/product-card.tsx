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
      <GlowCard color={color} className="h-full card-hover">
        <div className="flex h-full flex-col">
          <div
            className="relative grid aspect-[1.12] place-items-center overflow-hidden border-b border-line"
            style={{
              backgroundImage: `radial-gradient(120% 120% at 20% 0%, rgba(${color}, 0.22), transparent 62%), linear-gradient(165deg, var(--surface-2), var(--surface-3))`,
            }}
          >
            <RemoteImage
              src={product.imageUrl ? [product.imageUrl] : (product.imageSources ?? [])}
              alt={product.name}
              className="size-full object-cover transition duration-500 group-hover:scale-105"
              fallback={
                <div className="relative grid size-28 place-items-center rounded-[2rem] border border-white/40 bg-surface/70 shadow-[var(--shadow-md)] backdrop-blur transition duration-500 group-hover:scale-110">
                  <Icon aria-hidden className={cn('size-14 opacity-80', tint)} />
                </div>
              }
            />

            <div className="absolute start-2.5 top-2.5 flex flex-col items-start gap-1.5">
              {discount && (
                <span className="badge badge-accent shadow-[var(--shadow-sm)]">
                  {discount} تخفیف
                </span>
              )}
              {product.brandName && (
                <span className="badge badge-neutral bg-surface/85 backdrop-blur">
                  {product.brandName}
                </span>
              )}
            </div>

            <button
              type="button"
              aria-label="افزودن به علاقه‌مندی‌ها"
              className="btn btn-icon absolute end-2.5 top-2.5 size-8 border-line bg-surface/85 text-fg-muted opacity-0 backdrop-blur transition group-hover:opacity-100 hover:border-danger hover:text-danger focus-visible:opacity-100"
            >
              <Heart className="size-4" />
            </button>
          </div>

          <div className="flex flex-1 flex-col p-4">
            <span className={cn('mb-1.5 text-[11px] font-bold', tint)}>{product.categoryName}</span>
            <h3 className="line-clamp-2 text-sm font-bold leading-6 text-fg">
              {product.slug ? (
                <Link to={`/products/${product.slug}`} className="transition hover:text-brand">
                  {product.name}
                </Link>
              ) : (
                product.name
              )}
            </h3>

            <div className="mb-4 mt-2 flex items-center gap-2 text-[11px] text-fg-subtle">
              {product.rating ? (
                <span className="flex items-center gap-1 text-warning-ink">
                  <Star className="size-3.5 fill-current" />
                  {faNum(product.rating)}
                </span>
              ) : null}
              {product.rating && product.sold ? <span className="text-fg-subtle">•</span> : null}
              {product.sold ? <span>{faNum(product.sold)} فروش</span> : null}
            </div>

            <div className="mt-auto space-y-2.5">
              <div className="flex items-baseline gap-2">
                {product.oldPrice ? (
                  <span className="text-[11px] text-fg-subtle line-through tabular-nums">
                    {faNum(product.oldPrice)}
                  </span>
                ) : null}
                <span className="text-base font-black tabular-nums text-fg">
                  {product.price === null ? 'قیمت پس از انتخاب تنوع' : faPrice(product.price)}
                </span>
              </div>

              <button
                type="button"
                disabled={!product.slug}
                onClick={() => onAdd?.(product)}
                className="btn btn-primary btn-sm w-full disabled:cursor-default disabled:bg-surface-2 disabled:text-fg-muted disabled:shadow-none"
              >
                <ShoppingBag className="size-3.5" />
                {product.slug ? 'مشاهده و خرید' : 'نمایش نمونه'}
              </button>
            </div>
          </div>
        </div>
      </GlowCard>
    </motion.article>
  )
}
