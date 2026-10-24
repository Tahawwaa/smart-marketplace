import { Loader2 } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import type { VendorOutletContext } from '../../components/layout/require-vendor'
import { useAsync } from '../../hooks/use-async'
import { faNum, faPrice } from '../../lib/format'
import { fetchVendorOrders, fetchVendorAnalytics, subOrderStatusLabel } from './api'

export function VendorDashboardPage() {
  const { vendor } = useOutletContext<VendorOutletContext>()

  const analytics = useAsync((signal) => fetchVendorAnalytics(30, signal), 'vendor-dashboard-analytics')
  const orders = useAsync((signal) => fetchVendorOrders('', signal), 'vendor-dashboard-orders')

  const orderRows = orders.data?.data ?? []
  const summary = analytics.data?.data
  const loading = analytics.loading || orders.loading
  const openOrders = Object.entries(summary?.status_counts ?? {}).reduce((total, [status, count]) =>
    ['delivered', 'cancelled', 'refunded'].includes(status) ? total : total + count, 0)

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری…
      </p>
    )
  }

  if (analytics.error || orders.error) {
    return <p role="alert" className="alert alert-danger">{analytics.error ?? orders.error}</p>
  }

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div className="card px-4 py-3">
          <dt className="text-fg-subtle">کالاها</dt>
          <dd className="mt-1 tabular-nums text-fg">{faNum(summary?.catalog.products ?? 0)}</dd>
        </div>
        <div className="card px-4 py-3">
          <dt className="text-fg-subtle">در انتظار تأیید</dt>
          <dd className="mt-1 tabular-nums text-fg">{faNum(summary?.catalog.pending_products ?? 0)}</dd>
        </div>
        <div className="card px-4 py-3">
          <dt className="text-fg-subtle">سفارش‌های در جریان</dt>
          <dd className="mt-1 tabular-nums text-fg">{faNum(openOrders)}</dd>
        </div>
        <div className="card px-4 py-3">
          <dt className="text-fg-subtle">اقلام ناموجود</dt>
          <dd className="mt-1 tabular-nums text-fg">{faNum(summary?.catalog.out_of_stock ?? 0)}</dd>
        </div>
      </dl>

      <div className="card px-4 py-3 text-xs text-fg-muted">
        <p className="text-fg-subtle">شماره شبا</p>
        <p className="mt-1 tabular-nums">{vendor.bank_sheba ?? 'ثبت نشده است.'}</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-fg">آخرین سفارش‌های فروشگاه</h2>
        {orderRows.length === 0 ? (
          <p className="card px-4 py-6 text-center text-xs text-fg-subtle">
            سفارشی برای فروشگاه شما ثبت نشده است.
          </p>
        ) : (
          <ul className="list-none space-y-2 p-0 text-xs">
            {orderRows.slice(0, 5).map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-4 py-3"
              >
                <span className="min-w-0 break-all text-start text-fg">{row.sub_order_number}</span>
                <span className="text-fg-subtle">{subOrderStatusLabel(row.status)}</span>
                <span className="tabular-nums text-fg-muted">{faPrice(row.vendor_net_amount)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/vendor/orders" className="mt-3 inline-block text-xs font-bold text-brand hover:underline">
          مشاهده‌ی همه‌ی سفارش‌ها
        </Link>
      </div>

      <div className="grid gap-3 text-xs min-[400px]:grid-cols-2 sm:flex sm:flex-wrap">
        <Link
          to="/vendor/products/new"
          className="btn btn-primary"
        >
          افزودن کالای جدید
        </Link>
        <Link
          to="/vendor/inventory"
          className="btn btn-secondary"
        >
          مدیریت موجودی
        </Link>
      </div>
    </div>
  )
}
