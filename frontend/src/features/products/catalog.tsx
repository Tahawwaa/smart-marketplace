import { motion } from 'motion/react'
import { Loader2, PackageSearch, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/cn'
import { faNum } from '../../lib/format'
import { useAsync } from '../../hooks/use-async'
import { CATEGORIES } from '../home/data'
import { fetchProducts } from './api'
import { ProductCard, type ProductCardData } from './product-card'
import { SAMPLE_PRODUCTS } from './sample'

const SORTS = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'price_asc', label: 'ارزان‌ترین' },
  { value: 'price_desc', label: 'گران‌ترین' },
  { value: 'name', label: 'الفبایی' },
]

const PER_PAGE = 12

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: PER_PAGE }, (_, index) => (
        <div
          key={index}
          className="h-72 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]"
        />
      ))}
    </div>
  )
}

/** جایگزین نمایشی وقتی API کالایی برنمی‌گرداند؛ فقط برای دیده‌شدن چیدمان. */
function sampleAsCards(category: string, search: string): ProductCardData[] {
  const term = search.trim().toLowerCase()

  return SAMPLE_PRODUCTS.filter((product) => {
    if (category && product.category !== category) return false
    if (!term) return true
    return (
      product.name.toLowerCase().includes(term) || product.brand.toLowerCase().includes(term)
    )
  }).map((product) => ({
    id: product.id,
    name: product.name,
    categorySlug: product.category,
    categoryName: CATEGORIES.find((item) => item.slug === product.category)?.name ?? '',
    brandName: product.brand,
    price: product.price,
    oldPrice: product.oldPrice,
    rating: product.rating,
    sold: product.sold,
  }))
}

type Props = {
  category: string
  search: string
  onSelectCategory: (slug: string) => void
}

export function Catalog({ category, search, onSelectCategory }: Props) {
  const [sort, setSort] = useState('newest')
  const [perPage, setPerPage] = useState(PER_PAGE)

  // Collapse back to the first batch whenever the filters change.
  const filterKey = `${category}|${search}|${sort}`
  const [seenFilters, setSeenFilters] = useState(filterKey)
  if (seenFilters !== filterKey) {
    setSeenFilters(filterKey)
    setPerPage(PER_PAGE)
  }

  const query = {
    category: category || undefined,
    search: search || undefined,
    sort,
    per_page: perPage,
    page: 1,
  }

  const products = useAsync((signal) => fetchProducts(query, signal), JSON.stringify(query))

  const live: ProductCardData[] = (products.data?.data ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    categorySlug: product.category?.slug ?? '',
    categoryName: product.category?.name ?? '',
    brandName: product.brand?.name,
    price: product.price_from ?? null,
  }))

  const usingSample = live.length === 0
  const items = usingSample ? sampleAsCards(category, search) : live
  const total = usingSample ? items.length : (products.data?.meta?.total ?? items.length)
  const hasMore = !usingSample && items.length < total
  const activeCategory = CATEGORIES.find((item) => item.slug === category)

  return (
    <section id="products" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-4">
        <button
          type="button"
          aria-pressed={category === ''}
          onClick={() => onSelectCategory('')}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-xs transition',
            category === ''
              ? 'border-white/25 bg-white/10 font-bold text-white'
              : 'border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-white',
          )}
        >
          همه کالاها
        </button>
        {CATEGORIES.map((item) => (
          <button
            key={item.slug}
            type="button"
            aria-pressed={category === item.slug}
            onClick={() => onSelectCategory(item.slug)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition',
              category === item.slug
                ? 'border-white/25 bg-white/10 font-bold text-white'
                : 'border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-white',
            )}
          >
            <item.icon className={cn('size-3.5', category === item.slug ? 'text-white' : item.tint)} />
            {item.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-neutral-500">
          <SlidersHorizontal className="size-3.5 shrink-0" />
          <span className="truncate">
            {activeCategory ? activeCategory.name : 'همه دسته‌بندی‌ها'}
            {search ? <span className="text-neutral-400"> • «{search}»</span> : null}
            {total > 0 ? <span className="text-neutral-600"> • {faNum(total)} کالا</span> : null}
          </span>
        </p>

        {/* On narrow phones the four sort pills would overflow, so the group scrolls sideways. */}
        <div className="-mx-4 flex max-w-[calc(100%+2rem)] items-center gap-0.5 overflow-x-auto rounded-none border-white/[0.08] px-4 py-0.5 sm:mx-0 sm:max-w-full sm:gap-1 sm:rounded-full sm:border sm:p-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={sort === option.value}
              onClick={() => setSort(option.value)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs whitespace-nowrap transition',
                sort === option.value
                  ? 'bg-white font-bold text-black'
                  : 'text-neutral-400 hover:text-white',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {products.loading ? (
        <GridSkeleton />
      ) : products.error && usingSample ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] py-16 text-center">
          <p className="text-sm text-neutral-400">{products.error}</p>
          <button
            type="button"
            onClick={products.retry}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10"
          >
            <RefreshCw className="size-3.5" />
            تلاش دوباره
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] py-20 text-center">
          <PackageSearch className="size-8 text-neutral-600" />
          <p className="text-sm text-neutral-400">
            کالایی با این فیلترها پیدا نشد.
            {search ? ' عبارت دیگری را جست‌وجو کنید.' : ''}
          </p>
        </div>
      ) : (
        <>
          {usingSample && (
            <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-2.5 text-[11px] leading-6 text-amber-200/90">
              کالایی از سرویس API دریافت نشد؛ نمونهٔ نمایشی چیدمان نمایش داده می‌شود.
            </p>
          )}
          <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {items.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </motion.div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                disabled={products.loading}
                onClick={() => setPerPage((value) => value + PER_PAGE)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {products.loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                نمایش کالاهای بیشتر
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
