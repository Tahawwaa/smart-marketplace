import { ArrowRight, Loader2, PackageSearch, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../cart/cart-context'
import { useAsync } from '../../hooks/use-async'
import { faNum, faPrice } from '../../lib/format'
import { fetchProduct } from './api'

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const { add } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const product = useAsync((signal) => fetchProduct(slug, signal), slug)
  const detail = product.data?.data ?? null
  const image = detail?.images?.find((item) => item.is_primary) ?? detail?.images?.[0] ?? null

  if (product.loading) {
    return (
      <p className="flex items-center justify-center gap-2 px-4 py-24 text-sm text-neutral-400">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری کالا…
      </p>
    )
  }

  if (product.error || !detail) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <PackageSearch className="mx-auto size-8 text-neutral-600" />
        <p className="mt-3 text-sm text-neutral-400">{product.error ?? 'کالا پیدا نشد.'}</p>
        <Link to="/products" className="mt-5 inline-block text-xs text-cyan-300 hover:text-cyan-200">
          بازگشت به فهرست کالاها
        </Link>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-500">
        <Link to="/products" className="transition hover:text-neutral-200">
          کالاها
        </Link>
        <ArrowRight className="size-3.5 rotate-180" />
        <span className="truncate text-neutral-300">{detail.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="grid h-72 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          {image ? (
            <img src={image.path} alt={image.alt ?? detail.name} className="size-full rounded-2xl object-cover" />
          ) : (
            <PackageSearch className="size-12 text-neutral-700" />
          )}
        </div>

        <div>
          <h1 className="text-lg font-extrabold text-white">{detail.name}</h1>
          {detail.brand ? (
            <p className="mt-1 text-xs text-neutral-500">برند: {detail.brand.name}</p>
          ) : null}
          {detail.category ? (
            <p className="mt-0.5 text-xs text-neutral-500">دسته: {detail.category.name}</p>
          ) : null}

          <p className="mt-4 text-xl font-bold tabular-nums text-white">
            {detail.price_from === null || detail.price_from === undefined
              ? 'قیمت پس از انتخاب تنوع'
              : faPrice(detail.price_from)}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <label htmlFor="quantity" className="text-xs text-neutral-400">
              تعداد
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              className="w-20 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white outline-none"
            />
          </div>

          <button
            type="button"
            disabled={detail.price_from === null || detail.price_from === undefined}
            onClick={() => {
              add(
                {
                  id: detail.id,
                  slug: detail.slug,
                  name: detail.name,
                  price: detail.price_from ?? 0,
                },
                quantity,
              )
              setAdded(true)
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBag className="size-4" />
            افزودن به سبد خرید
          </button>

          {added ? (
            <p className="mt-3 text-xs text-emerald-300">
              به سبد اضافه شد.{' '}
              <Link to="/cart" className="underline">
                مشاهده سبد خرید
              </Link>
            </p>
          ) : null}

          {detail.description ? (
            <div className="mt-6 border-t border-white/[0.06] pt-5">
              <h2 className="mb-2 text-xs font-bold text-neutral-300">توضیحات</h2>
              <p className="text-xs leading-7 text-neutral-400">{detail.description}</p>
            </div>
          ) : null}

          {detail.variants?.length ? (
            <div className="mt-6 border-t border-white/[0.06] pt-5">
              <h2 className="mb-2 text-xs font-bold text-neutral-300">
                تنوع‌ها ({faNum(detail.variants.length)})
              </h2>
              <ul className="list-none space-y-2 p-0 text-xs text-neutral-400">
                {detail.variants.map((variant) => (
                  <li key={variant.id} className="rounded-lg border border-white/[0.07] px-3 py-2">
                    {variant.sku ? <span className="tabular-nums">کد: {variant.sku}</span> : 'تنوع کالا'}
                    {variant.attributes?.length ? (
                      <span className="text-neutral-500">
                        {' '}
                        — {variant.attributes.map((attr) => `${attr.name}: ${attr.values.map((v) => v.value).join('، ')}`).join(' | ')}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
