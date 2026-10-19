import { ArrowRight, CheckCircle2, PackageSearch, ShoppingBag, Store } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../lib/api/client'
import { useCart } from '../cart/cart-context'
import { useAsync } from '../../hooks/use-async'
import { faNum, faPrice } from '../../lib/format'
import { RemoteImage } from '../../components/ui/remote-image'
import { fetchProduct, fetchRecommendations } from './api'
import { productImageSources } from './images'
import { ProductCard } from './product-card'

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const { add } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [inventoryId, setInventoryId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const product = useAsync((signal) => fetchProduct(slug, signal), slug)
  const related = useAsync((signal) => fetchRecommendations(slug, signal), slug)
  const relatedItems = related.data?.data ?? []
  const detail = product.data?.data ?? null
  const image = detail?.images?.find((item) => item.is_primary) ?? detail?.images?.[0] ?? null

  const imageSources = detail
    ? [
        ...(image ? [image.path] : []),
        ...productImageSources(detail.name, detail.category?.slug ?? '', detail.id),
      ]
    : []

  // موجودی‌ها زیر هر تنوع می‌آیند؛ ارزان‌ترین موجودی قابل خرید انتخاب می‌شود.
  const offers = (detail?.variants ?? []).flatMap((variant) => variant.inventories ?? [])
  const selected =
    offers.find((offer) => offer.id === inventoryId) ??
    [...offers].sort((a, b) => a.effective_price - b.effective_price)[0] ??
    null
  const price = selected?.effective_price ?? detail?.price_from ?? null

  if (product.loading) {
    return (
      <section className="container-page py-8" aria-busy="true">
        <div className="skeleton mb-6 h-4 w-40" />
        <div className="grid gap-8 md:grid-cols-2">
          <div className="skeleton aspect-square w-full rounded-3xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-10 w-1/2" />
            <div className="skeleton h-40 w-full" />
          </div>
        </div>
      </section>
    )
  }

  if (product.error || !detail) {
    return (
      <div className="container-page py-24 text-center">
        <PackageSearch className="mx-auto size-10 text-fg-subtle" />
        <p className="mt-3 text-sm text-fg-muted">{product.error ?? 'کالا پیدا نشد.'}</p>
        <Link to="/products" className="btn btn-secondary btn-sm mt-5">
          بازگشت به فهرست کالاها
        </Link>
      </div>
    )
  }

  return (
    <section className="container-page py-5 sm:py-8">
      <nav className="mb-4 flex min-w-0 items-center gap-2 text-xs text-fg-subtle sm:mb-6">
        <Link to="/products" className="transition hover:text-fg">
          کالاها
        </Link>
        <ArrowRight className="size-3.5 rotate-180" />
        <span className="truncate text-fg-muted">{detail.name}</span>
      </nav>

      <div className="grid gap-5 sm:gap-8 md:grid-cols-2 md:items-start">
        <div className="card mx-auto grid aspect-square w-full max-w-sm place-items-center overflow-hidden bg-gradient-to-br from-surface-2 to-surface-3 md:sticky md:top-24 md:max-w-none">
          <RemoteImage
            src={imageSources}
            alt={image?.alt ?? detail.name}
            className="size-full object-contain p-5 drop-shadow-[0_24px_28px_rgba(15,23,42,0.25)] sm:p-8"
            fallback={<PackageSearch className="size-16 text-fg-subtle" />}
          />
        </div>

        <div>
          <h1 className="page-title">{detail.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {detail.brand ? <span className="badge badge-neutral">برند: {detail.brand.name}</span> : null}
            {detail.category ? <span className="badge badge-neutral">دسته: {detail.category.name}</span> : null}
          </div>

          <div className="panel mt-5">
            <p className="text-xs text-fg-subtle">قیمت</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-fg sm:text-3xl">
              {price === null ? 'قیمت پس از انتخاب تنوع' : faPrice(price)}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <label htmlFor="quantity" className="label !mb-0">
                تعداد
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                className="input !w-24"
              />
            </div>

            <button
              type="button"
              disabled={selected === null}
              onClick={() => {
                if (selected === null) return
                setError(null)
                add(selected.id, quantity)
                  .then(() => setAdded(true))
                  .catch((cause: unknown) =>
                    setError(cause instanceof ApiError ? cause.message : 'افزودن به سبد انجام نشد.'),
                  )
              }}
              className="btn btn-primary btn-lg mt-5 w-full disabled:cursor-not-allowed"
            >
              <ShoppingBag className="size-4" />
              افزودن به سبد خرید
            </button>

            {added ? (
              <p className="alert alert-success mt-3 flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>
                  به سبد اضافه شد.{' '}
                  <Link to="/cart" className="font-bold underline">
                    مشاهده سبد خرید
                  </Link>
                </span>
              </p>
            ) : null}

            {error ? <p className="alert alert-danger mt-3">{error}</p> : null}
          </div>

          {detail.description ? (
            <div className="mt-6">
              <h2 className="section-title mb-2">توضیحات</h2>
              <p className="text-sm leading-8 text-fg-muted">{detail.description}</p>
            </div>
          ) : null}

          {detail.variants?.length ? (
            <div className="mt-6">
              <h2 className="section-title mb-2">
                تنوع‌ها ({faNum(detail.variants.length)})
              </h2>
              <ul className="list-none space-y-2 p-0 text-xs text-fg-muted">
                {detail.variants.map((variant) => (
                  <li key={variant.id} className="panel-muted !p-3">
                    {variant.sku ? <span className="tabular-nums">کد: {variant.sku}</span> : 'تنوع کالا'}
                    {variant.attributes?.length ? (
                      <span className="text-fg-subtle">
                        {' '}
                        — {variant.attributes.map((attr) => `${attr.name}: ${attr.values.map((v) => v.value).join('، ')}`).join(' | ')}
                      </span>
                    ) : null}
                    {variant.inventories?.length ? (
                      <ul className="mt-2 list-none space-y-1 p-0">
                        {variant.inventories.map((offer) => (
                          <li key={offer.id}>
                            <label
                              className={`flex cursor-pointer flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 transition sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:py-2 ${
                                selected?.id === offer.id
                                  ? 'border-brand bg-brand-soft'
                                  : 'border-line bg-surface hover:border-line-strong'
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <input
                                  type="radio"
                                  name="offer"
                                  checked={selected?.id === offer.id}
                                  onChange={() => setInventoryId(offer.id)}
                                  className="accent-[var(--brand)]"
                                />
                                <Store className="size-3.5 text-fg-subtle" />
                                <span className="truncate text-fg">
                                  {offer.vendor?.store_name ?? 'فروشنده'}
                                </span>
                              </span>
                              <span className="ps-6 font-bold tabular-nums text-fg sm:ps-0">
                                {faPrice(offer.effective_price)}
                                <span className="text-fg-subtle">
                                  {' '}
                                  ({faNum(offer.available_quantity)} عدد)
                                </span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {relatedItems.length > 0 && (
        <div className="mt-10 sm:mt-12">
          <h2 className="mb-4 text-lg font-black text-fg">پیشنهادهای مشابه</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {relatedItems.slice(0, 4).map((item, index) => (
              <ProductCard
                key={item.id}
                index={index}
                product={{
                  id: item.id,
                  slug: item.slug,
                  name: item.name,
                  categorySlug: item.category?.slug ?? '',
                  categoryName: item.category?.name ?? '',
                  brandName: item.brand?.name,
                  price: item.price_from ?? null,
                  imageSources: [
                    ...(item.images?.length
                      ? [(item.images.find((img) => img.is_primary) ?? item.images[0]).path]
                      : []),
                    ...productImageSources(item.name, item.category?.slug ?? '', item.id),
                  ],
                }}
                onAdd={() => undefined}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
