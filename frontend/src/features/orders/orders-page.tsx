import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../hooks/use-async'
import { faNum, faPrice } from '../../lib/format'
import { fetchOrders } from './api'

export function OrdersPage() {
  const orders = useAsync((signal) => fetchOrders(signal), 'orders')
  const items = orders.data?.data ?? []

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-base font-extrabold text-white">سفارش‌های من</h1>

      {orders.loading ? (
        <p className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="size-4 animate-spin" />
          در حال بارگذاری…
        </p>
      ) : orders.error ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] py-16 text-center">
          <p className="text-sm text-neutral-400">{orders.error}</p>
          <button
            type="button"
            onClick={orders.retry}
            className="mt-4 rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10"
          >
            تلاش دوباره
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] py-20 text-center">
          <p className="text-sm text-neutral-400">هنوز سفارشی ثبت نشده است.</p>
          <Link to="/products" className="mt-4 inline-block text-xs text-cyan-300 hover:text-cyan-200">
            رفتن به فهرست کالاها
          </Link>
        </div>
      ) : (
        <ul className="list-none space-y-3 p-0">
          {items.map((order) => (
            <li key={order.id}>
              <Link
                to={`/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition hover:border-white/20"
              >
                <span className="text-sm text-white">سفارش {order.order_number}</span>
                <span className="text-xs text-neutral-400">{order.status}</span>
                <span className="text-xs tabular-nums text-neutral-300">
                  {faPrice(order.grand_total)}
                  {order.items_count ? (
                    <span className="text-neutral-500"> • {faNum(order.items_count)} قلم</span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
