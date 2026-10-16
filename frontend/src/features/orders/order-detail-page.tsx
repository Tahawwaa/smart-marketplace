import { Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../../hooks/use-async'
import { faPrice } from '../../lib/format'
import { fetchOrder } from './api'

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const order = useAsync((signal) => fetchOrder(Number(id), signal), id)
  const detail = order.data?.data ?? null

  if (order.loading) {
    return (
      <p className="flex items-center justify-center gap-2 px-4 py-24 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری سفارش…
      </p>
    )
  }

  if (order.error || !detail) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-fg-muted">{order.error ?? 'سفارش پیدا نشد.'}</p>
        <Link to="/orders" className="mt-4 inline-block text-xs font-bold text-brand hover:underline">
          بازگشت به سفارش‌ها
        </Link>
      </div>
    )
  }

  return (
    <section className="container-page max-w-3xl py-8">
      <Link to="/orders" className="text-xs text-fg-subtle transition hover:text-fg">
        ← سفارش‌های من
      </Link>

      <h1 className="mt-4 page-title">سفارش {detail.order_number}</h1>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="card px-4 py-3">
          <dt className="text-fg-subtle">وضعیت سفارش</dt>
          <dd className="mt-1 text-fg">{detail.status}</dd>
        </div>
        <div className="card px-4 py-3">
          <dt className="text-fg-subtle">وضعیت پرداخت</dt>
          <dd className="mt-1 text-fg">{detail.payment_status}</dd>
        </div>
        <div className="card px-4 py-3">
          <dt className="text-fg-subtle">مبلغ کالاها</dt>
          <dd className="mt-1 tabular-nums text-fg">{faPrice(detail.total_items_price)}</dd>
        </div>
        <div className="card px-4 py-3">
          <dt className="text-fg-subtle">مبلغ نهایی</dt>
          <dd className="mt-1 tabular-nums text-fg">{faPrice(detail.grand_total)}</dd>
        </div>
      </dl>

      {detail.sub_orders?.map((subOrder) => (
        <div key={subOrder.id} className="mt-6">
          <h2 className="mb-2 text-xs font-bold text-fg-muted">
            {subOrder.vendor?.store_name ?? `زیرسفارش ${subOrder.sub_order_number}`}
          </h2>
          <ul className="list-none space-y-2 p-0 text-xs text-fg-muted">
            {subOrder.items?.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between border-b border-line py-2"
              >
                <span>
                  {item.product_name_snapshot} × {item.quantity}
                </span>
                <span className="tabular-nums">{faPrice(item.total_price)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-6 rounded-xl border border-line px-4 py-3 text-xs text-fg-muted">
        <p className="text-fg-subtle">نشانی تحویل</p>
        <p className="mt-1">
          {detail.shipping_address_snapshot.recipient_name} —{' '}
          {detail.shipping_address_snapshot.recipient_phone}
        </p>
        <p className="mt-0.5 text-fg-muted">
          {detail.shipping_address_snapshot.province}، {detail.shipping_address_snapshot.city}،{' '}
          {detail.shipping_address_snapshot.address_line}
        </p>
      </div>

      {detail.payment_status === 'paid' ? (
        <p className="alert alert-success mt-6">
          پرداخت این سفارش انجام شده است.
        </p>
      ) : detail.status === 'cancelled' || detail.status === 'refunded' ? (
        <p className="mt-6 rounded-xl border border-line px-4 py-3 text-xs text-fg-muted">
          این سفارش پرداخت‌شدنی نیست.
        </p>
      ) : (
        <Link
          to={`/orders/${detail.id}/pay`}
          className="btn btn-primary mt-6"
        >
          پرداخت سفارش
        </Link>
      )}
    </section>
  )
}
