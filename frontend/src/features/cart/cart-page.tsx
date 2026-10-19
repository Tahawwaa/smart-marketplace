import { Loader2, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { faNum, faPrice } from '../../lib/format'
import { useCart } from './cart-context'

export function CartPage() {
  const { items, total, loading, error, setQuantity, remove, clear } = useCart()

  return (
    <section className="container-page max-w-3xl py-6 sm:py-8">
      <h1 className="mb-6 page-title">سبد خرید</h1>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Loader2 className="size-4 animate-spin" />
          در حال بارگذاری…
        </p>
      ) : items.length === 0 ? (
        <div className="card py-20 text-center">
          <p className="text-sm text-fg-muted">{error ?? 'سبد خرید خالی است.'}</p>
          <Link to="/products" className="mt-4 inline-block text-xs font-bold text-brand hover:underline">
            رفتن به فهرست کالاها
          </Link>
        </div>
      ) : (
        <>
          <ul className="list-none space-y-3 p-0">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              >
                <Link
                  to={`/products/${item.product?.slug ?? ''}`}
                  className="min-w-0 break-words text-sm text-fg hover:text-brand"
                >
                  {item.product?.name ?? 'کالا'}
                </Link>
                <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    aria-label={`تعداد ${item.product?.name ?? ''}`}
                    onChange={(event) => setQuantity(item.id, Number(event.target.value) || 0)}
                    className="input !w-20 shrink-0 !py-1.5"
                  />
                  <span className="min-w-0 flex-1 text-end text-xs tabular-nums text-fg-muted sm:min-w-28 sm:flex-none">
                    {faPrice(item.total_price)}
                  </span>
                  <button
                    type="button"
                    aria-label={`حذف ${item.product?.name ?? ''}`}
                    onClick={() => remove(item.id)}
                    className="btn btn-danger btn-icon btn-sm shrink-0"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {error ? (
            <p className="alert alert-danger mt-4">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <span className="text-sm text-fg-muted">
              مجموع: <span className="font-bold tabular-nums text-fg">{faPrice(total)}</span>{' '}
              <span className="text-fg-subtle">({faNum(items.length)} قلم)</span>
            </span>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={clear}
                className="btn btn-secondary btn-sm"
              >
                خالی‌کردن سبد
              </button>
              <Link
                to="/checkout"
                className="btn btn-primary w-full sm:w-auto"
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
