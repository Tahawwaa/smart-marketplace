import { motion } from 'motion/react'
import { PackageSearch, RefreshCw, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { faNum } from '../../lib/format'
import { useAsync } from '../../hooks/use-async'
import { CATEGORIES } from '../home/data'
import { fetchCategories, fetchProducts } from './api'
import { ProductCard, type ProductCardData } from './product-card'
import { Pager } from '../../components/ui/pager'
import { productImageSources } from './images'

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
          className="skeleton h-72 rounded-2xl"
        />
      ))}
    </div>
  )
}

export function Catalog() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const categories = useAsync((signal) => fetchCategories(signal), 'catalog-categories')
  const categoryOptions = (categories.data?.data ?? []).map((item) => ({
    ...item,
    icon: CATEGORIES.find((known) => known.slug === item.slug)?.icon ?? ShoppingBag,
    tint: CATEGORIES.find((known) => known.slug === item.slug)?.tint ?? 'text-fg-muted',
  }))
  const category = params.get('category') ?? ''
  const search = params.get('search') ?? ''
  const brand = params.get('brand') ?? ''
  const vendor = params.get('vendor') ?? ''
  const sort = SORTS.some((option) => option.value === params.get('sort')) ? params.get('sort')! : 'newest'
  const requestedPage = Number(params.get('page') ?? 1)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const setPage = (value: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(value))
    setParams(next)
  }
  const setSort = (value: string) => {
    const next = new URLSearchParams(params)
    next.set('sort', value)
    next.delete('page')
    setParams(next)
  }

  const onSelectCategory = (slug: string) => {
    const next = new URLSearchParams(params)
    next.delete('page')
    if (slug) next.set('category', slug)
    else next.delete('category')
    setParams(next)
  }

  const query = {
    category: category || undefined,
    search: search || undefined,
    brand: brand || undefined,
    vendor: vendor || undefined,
    sort,
    per_page: PER_PAGE,
    page,
  }

  const products = useAsync((signal) => fetchProducts(query, signal), JSON.stringify(query))

  const items: ProductCardData[] = (products.data?.data ?? []).map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    categorySlug: product.category?.slug ?? '',
    categoryName: product.category?.name ?? '',
    brandName: product.brand?.name,
    price: product.price_from ?? null,
    imageSources: [
      ...(product.images?.length ? [(product.images.find((image) => image.is_primary) ?? product.images[0]).path] : []),
      ...productImageSources(product.name, product.category?.slug ?? '', product.id),
    ],
  }))

  const total = products.data?.meta?.total ?? items.length
  const activeCategory = categoryOptions.find((item) => item.slug === category)

  const onAddToCart = (product: ProductCardData) => {
    // فهرست کالاها موجودی نمی‌فرستد؛ برای انتخاب تنوع به صفحه‌ی کالا می‌رویم.
    if (product.slug) navigate(`/products/${product.slug}`)
  }

  return (
    <section id="products" className="container-page py-12 sm:py-16">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">ویترین فروشگاه</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-fg sm:text-3xl">
            برای انتخاب بهتر آماده‌اید؟
          </h2>
          <p className="mt-2 max-w-xl text-xs leading-7 text-fg-muted sm:text-sm">
            دسته‌بندی موردنظر را انتخاب کنید یا بین پیشنهادهای امروز جست‌وجو کنید.
          </p>
        </div>
        <span className="badge badge-neutral self-start sm:self-auto">
          <ShoppingBag className="size-3.5" />
          انتخاب‌های روزانه شما
        </span>
      </div>

      <div className="scrollbar-none -mx-4 flex items-center gap-2 overflow-x-auto border-b border-line px-4 pb-5 sm:mx-0 sm:px-0">
        <button
          type="button"
          aria-pressed={category === ''}
          onClick={() => onSelectCategory('')}
          className="chip"
        >
          همه کالاها
        </button>
        {categoryOptions.map((item) => (
          <button
            key={item.slug}
            type="button"
            aria-pressed={category === item.slug}
            onClick={() => onSelectCategory(item.slug)}
            className="chip"
          >
            <item.icon className={cn('size-3.5', category === item.slug ? 'text-bg' : item.tint)} />
            {item.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 py-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-fg-subtle">
          <SlidersHorizontal className="size-3.5 shrink-0" />
          <span className="truncate">
            {activeCategory ? activeCategory.name : 'همه دسته‌بندی‌ها'}
            {search ? <span className="text-fg-muted"> • «{search}»</span> : null}
            {total > 0 ? <span className="text-fg-subtle"> • {faNum(total)} کالا</span> : null}
          </span>
        </p>

        {/* On narrow phones the four sort pills would overflow, so the group scrolls sideways. */}
        <div className="scrollbar-none -mx-4 flex max-w-[calc(100%+2rem)] items-center gap-0.5 overflow-x-auto rounded-none border-line px-4 py-0.5 sm:mx-0 sm:max-w-full sm:gap-1 sm:rounded-full sm:border sm:bg-surface sm:p-1">
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={sort === option.value}
              onClick={() => setSort(option.value)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs whitespace-nowrap transition',
                sort === option.value
                  ? 'bg-brand font-bold text-brand-fg shadow-[var(--shadow-sm)]'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {products.loading ? (
        <GridSkeleton />
      ) : products.error ? (
        <div className="card flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-sm text-fg-muted">{products.error}</p>
          <button type="button" onClick={products.retry} className="btn btn-secondary btn-sm">
            <RefreshCw className="size-3.5" />
            تلاش دوباره
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-fg-subtle">
            <PackageSearch className="size-7" />
          </span>
          <p className="text-sm text-fg-muted">
            کالایی با این فیلترها پیدا نشد.
            {search ? ' عبارت دیگری را جست‌وجو کنید.' : ''}
          </p>
        </div>
      ) : (
        <>
          <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {items.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} onAdd={onAddToCart} />
            ))}
          </motion.div>

          <div className="mt-8 flex justify-center">
            <Pager page={page} lastPage={products.data?.meta?.last_page ?? 1} total={total} onChange={setPage} />
          </div>
        </>
      )}
    </section>
  )
}
