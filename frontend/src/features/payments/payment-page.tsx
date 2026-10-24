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
  return <OrderPayment key={orderId} orderId={orderId} />
}

function OrderPayment({ orderId }: { orderId: string }) {
  const id = Number(orderId)

  const order = useAsync((signal) => fetchOrder(id, signal), orderId)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detail = order.data?.data ?? null
  const alreadyPaid = detail?.payment_status === 'paid'
  const payable = detail !== null && ['pending', 'failed'].includes(detail.payment_status)
    && !['cancelled', 'refunded'].includes(detail.status)

  /** پرداخت دوبخشی است: ساخت تلاش، و بعد پرسیدن نتیجه از درگاه. */
  async function pay() {
    if (detail === null || !payable || busy) return

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
      <p className="flex items-center justify-center gap-2 px-4 py-24 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری سفارش…
      </p>
    )
  }

  if (order.error || detail === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-fg-muted">{order.error ?? 'سفارش پیدا نشد.'}</p>
        <Link to="/orders" className="mt-4 inline-block text-xs font-bold text-brand hover:underline">
          بازگشت به سفارش‌ها
        </Link>
      </div>
    )
  }

  return (
    <section className="container-page max-w-2xl py-6 sm:py-8">
      <Link
        to={`/orders/${detail.id}`}
        className="text-xs text-fg-subtle transition hover:text-fg"
      >
        ← سفارش {detail.order_number}
      </Link>

      <h1 className="mt-4 page-title">پرداخت سفارش</h1>

      <div className="alert alert-warning mt-4">
        <p className="font-bold">درگاه آزمایشی</p>
        <p className="mt-1 text-start leading-5">
          این نسخه به درگاه واقعی متصل نیست و هیچ پولی جابه‌جا نمی‌شود؛ پرداخت همیشه موفق اعلام
          می‌گردد. فقط برای آزمودن جریان سفارش است.
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-xs">
        <div className="card px-4 py-3">
          <dt className="text-fg-subtle">وضعیت پرداخت</dt>
          <dd className="mt-1 text-fg">{paymentStatusLabel(detail.payment_status)}</dd>
        </div>
        <div className="card px-4 py-3">
          <dt className="text-fg-subtle">مبلغ قابل پرداخت</dt>
          <dd className="mt-1 tabular-nums text-fg">{faPrice(detail.grand_total)}</dd>
        </div>
      </dl>

      {payment ? (
        <div className="mt-4 rounded-xl border border-line px-4 py-3 text-xs text-fg-muted">
          <p>
            شناسه‌ی پرداخت: <span className="tabular-nums">{payment.id}</span>
          </p>
          <p className="mt-1">
            مرجع درگاه: <span className="tabular-nums">{payment.reference_id ?? '—'}</span>
          </p>
          <p className="mt-1">وضعیت: {paymentStatusLabel(payment.status)}</p>
          {payment.paid_at ? (
            <p className="mt-1 text-success-ink">
              پرداخت در {new Date(payment.paid_at).toLocaleString('fa-IR')} ثبت شد.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="alert alert-danger mt-4">
          {error}
        </p>
      ) : null}

      {alreadyPaid && payment === null ? (
        <p className="mt-4 text-xs text-success-ink">این سفارش قبلاً پرداخت شده است.</p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={busy || !payable}
          onClick={() => void pay()}
          className="btn btn-primary w-full sm:w-auto"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          پرداخت آزمایشی
        </button>
        <Link
          to={`/orders/${detail.id}`}
          className="btn btn-secondary w-full sm:w-auto"
        >
          بازگشت به سفارش
        </Link>
      </div>
    </section>
  )
}
