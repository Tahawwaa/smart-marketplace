import { Loader2, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { faNum, faPrice } from '../../lib/format'
import { useCart } from './cart-context'

export function CartPage() {
  const { items, total, loading, error, setQuantity, remove, clear } = useCart()

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-base font-extrabold text-white">سبد خرید</h1>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="size-4 animate-spin" />
          در حال بارگذاری…
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] py-20 text-center">
          <p className="text-sm text-neutral-400">{error ?? 'سبد خرید خالی است.'}</p>
          <Link to="/products" className="mt-4 inline-block text-xs text-cyan-300 hover:text-cyan-200">
            رفتن به فهرست کالاها
          </Link>
        </div>
      ) : (
        <>
          <ul className="list-none space-y-3 p-0">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
              >
                <Link
                  to={`/products/${item.product?.slug ?? ''}`}
                  className="text-sm text-white hover:text-cyan-200"
                >
                  {item.product?.name ?? 'کالا'}
                </Link>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    aria-label={`تعداد ${item.product?.name ?? ''}`}
                    onChange={(event) => setQuantity(item.id, Number(event.target.value) || 0)}
                    className="w-16 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-white outline-none"
                  />
                  <span className="min-w-28 text-end text-xs tabular-nums text-neutral-300">
                    {faPrice(item.total_price)}
                  </span>
                  <button
                    type="button"
                    aria-label={`حذف ${item.product?.name ?? ''}`}
                    onClick={() => remove(item.id)}
                    className="grid size-8 place-items-center rounded-lg border border-white/10 text-neutral-400 transition hover:text-rose-300"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {error ? (
            <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-2.5 text-xs text-rose-200">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
            <span className="text-sm text-neutral-300">
              مجموع: <span className="font-bold tabular-nums text-white">{faPrice(total)}</span>{' '}
              <span className="text-neutral-500">({faNum(items.length)} قلم)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clear}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs text-neutral-300 transition hover:text-white"
              >
                خالی‌کردن سبد
              </button>
              <Link
                to="/checkout"
                className="rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2 text-xs font-bold text-white transition hover:bg-white/10"
              >
                ادامه سفارش
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
