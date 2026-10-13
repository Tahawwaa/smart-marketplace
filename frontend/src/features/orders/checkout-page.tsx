import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../lib/api/client'
import { faPrice } from '../../lib/format'
import { useCart } from '../cart/cart-context'
import { placeOrder } from './api'

export function CheckoutPage() {
  const { items, total, clear } = useCart()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const response = await placeOrder(items)
      clear()
      navigate(`/orders/${response.data.id}`)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ثبت سفارش انجام نشد.')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm text-neutral-400">سبد خرید خالی است.</p>
        <Link to="/products" className="mt-4 inline-block text-xs text-cyan-300 hover:text-cyan-200">
          رفتن به فهرست کالاها
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-base font-extrabold text-white">تکمیل سفارش</h1>

      <ul className="list-none space-y-2 p-0 text-xs text-neutral-300">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between border-b border-white/[0.06] py-2">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="tabular-nums">{faPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-neutral-300">
        مبلغ قابل پرداخت:{' '}
        <span className="font-bold tabular-nums text-white">{faPrice(total)}</span>
      </p>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-2.5 text-xs text-rose-200">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={submitting}
        onClick={submit}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        ثبت سفارش
      </button>
      <p className="mt-3 text-[11px] text-neutral-500">
        ثبت سفارش نیازمند ورود به حساب کاربری است و از مسیر <code>POST /orders</code> انجام می‌شود.
      </p>
    </section>
  )
}
