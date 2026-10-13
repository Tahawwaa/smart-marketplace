import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faPrice } from '../../lib/format'
import { fetchOrder } from '../orders/api'
import { paymentStatusLabel, startPayment, verifyPayment } from './api'
import type { Payment } from '../../types/api'

export function PaymentPage() {
  const { orderId = '' } = useParams()
  const id = Number(orderId)

  const order = useAsync((signal) => fetchOrder(id, signal), orderId)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detail = order.data?.data ?? null
  const alreadyPaid = detail?.payment_status === 'paid'

  /** پرداخت دوبخشی است: ساخت تلاش، و بعد پرسیدن نتیجه از درگاه. */
  async function pay() {
    if (detail === null) return

    setBusy(true)
    setError(null)
    try {
      const started = await startPayment(detail.id)
      setPayment(started.data)

      if (started.redirect_url) {
        window.location.assign(started.redirect_url)
        return
      }

      const verified = await verifyPayment(started.data.id)
      setPayment(verified.data)
      order.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'پرداخت انجام نشد.')
    } finally {
      setBusy(false)
    }
  }

  if (order.loading) {
    return (
      <p className="flex items-center justify-center gap-2 px-4 py-24 text-sm text-neutral-400">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری سفارش…
      </p>
    )
  }

  if (order.error || detail === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-neutral-400">{order.error ?? 'سفارش پیدا نشد.'}</p>
        <Link to="/orders" className="mt-4 inline-block text-xs text-cyan-300 hover:text-cyan-200">
          بازگشت به سفارش‌ها
        </Link>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to={`/orders/${detail.id}`}
        className="text-xs text-neutral-500 transition hover:text-neutral-200"
      >
        ← سفارش {detail.order_number}
      </Link>

      <h1 className="mt-4 text-base font-extrabold text-white">پرداخت سفارش</h1>

      <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-xs text-amber-100">
        <p className="font-bold">درگاه آزمایشی</p>
        <p className="mt-1 text-start leading-5">
          این نسخه به درگاه واقعی متصل نیست و هیچ پولی جابه‌جا نمی‌شود؛ پرداخت همیشه موفق اعلام
          می‌گردد. فقط برای آزمودن جریان سفارش است.
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-white/[0.08] px-4 py-3">
          <dt className="text-neutral-500">وضعیت پرداخت</dt>
          <dd className="mt-1 text-neutral-200">{paymentStatusLabel(detail.payment_status)}</dd>
        </div>
        <div className="rounded-xl border border-white/[0.08] px-4 py-3">
          <dt className="text-neutral-500">مبلغ قابل پرداخت</dt>
          <dd className="mt-1 tabular-nums text-white">{faPrice(detail.grand_total)}</dd>
        </div>
      </dl>

      {payment ? (
        <div className="mt-4 rounded-xl border border-white/[0.08] px-4 py-3 text-xs text-neutral-300">
          <p>
            شناسه‌ی پرداخت: <span className="tabular-nums">{payment.id}</span>
          </p>
          <p className="mt-1">
            مرجع درگاه: <span className="tabular-nums">{payment.reference_id ?? '—'}</span>
          </p>
          <p className="mt-1">وضعیت: {paymentStatusLabel(payment.status)}</p>
          {payment.paid_at ? (
            <p className="mt-1 text-emerald-200">
              پرداخت در {new Date(payment.paid_at).toLocaleString('fa-IR')} ثبت شد.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-2.5 text-xs text-rose-200">
          {error}
        </p>
      ) : null}

      {alreadyPaid && payment === null ? (
        <p className="mt-4 text-xs text-emerald-200">این سفارش قبلاً پرداخت شده است.</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy || alreadyPaid}
          onClick={() => void pay()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          پرداخت آزمایشی
        </button>
        <Link
          to={`/orders/${detail.id}`}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-neutral-300 transition hover:border-white/25 hover:text-white"
        >
          بازگشت به سفارش
        </Link>
      </div>
    </section>
  )
}
