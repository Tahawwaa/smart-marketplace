import {
  AlertTriangle,
  BadgeDollarSign,
  Boxes,
  ScrollText,
  Store,
  Users,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../hooks/use-async'
import { faNum, faPrice } from '../../lib/format'
import { paymentStatusLabel } from '../payments/api'
import { AdminError, AdminLoading, AdminPanel, StatCard, StatusPill } from './admin-ui'
import { adminOrderStatusLabel, fetchDashboard } from './api'
import { RevenueChart } from './revenue-chart'

export function AdminDashboardPage() {
  const { data, error, loading, retry } = useAsync(
    (signal) => fetchDashboard(14, signal),
    'admin-dashboard',
  )

  if (loading) return <AdminLoading label="در حال آماده‌سازی داشبورد…" />
  if (error) return <AdminError message={error} />

  const dashboard = data?.data
  if (!dashboard) return <AdminError message="داده‌ای از سرور دریافت نشد." />

  const { cards, pending_queues: queues } = dashboard
  const pendingTotal = queues.vendors + queues.products

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="درآمد کل (پرداخت‌شده)"
          value={faPrice(cards.revenue_total) ?? '۰ تومان'}
          hint={`۳۰ روز گذشته: ${faPrice(cards.revenue_30_days)}`}
          icon={Wallet}
          tone="emerald"
        />
        <StatCard
          label="سفارش‌ها"
          value={faNum(cards.orders_total)}
          hint={`${faNum(cards.orders_today)} سفارش امروز`}
          icon={ScrollText}
          tone="cyan"
        />
        <StatCard
          label="فروشگاه‌ها"
          value={faNum(cards.vendors_total)}
          hint={`${faNum(cards.vendors_pending)} در انتظار تأیید`}
          icon={Store}
          tone="violet"
        />
        <StatCard
          label="کالاها"
          value={faNum(cards.products_total)}
          hint={`${faNum(cards.products_pending)} در انتظار تأیید`}
          icon={Boxes}
          tone="amber"
        />
        <StatCard
          label="مشتریان"
          value={faNum(cards.customers_total)}
          icon={Users}
          tone="cyan"
        />
        <StatCard
          label="درآمد امروز"
          value={faPrice(cards.revenue_today) ?? '۰ تومان'}
          icon={BadgeDollarSign}
          tone="emerald"
        />
        <StatCard
          label="موجودی کم"
          value={faNum(cards.low_stock_variants)}
          hint="گونه‌های با موجودی ۳ یا کمتر"
          icon={AlertTriangle}
          tone="rose"
        />
        <StatCard
          label="در صف بررسی"
          value={faNum(pendingTotal)}
          hint={`${faNum(queues.unpaid_orders)} سفارش پرداخت‌نشده`}
          icon={AlertTriangle}
          tone="amber"
        />
      </div>

      <AdminPanel
        title="روند درآمد ۱۴ روز گذشته"
        action={
          <button
            type="button"
            onClick={retry}
            className="btn btn-secondary btn-sm"
          >
            به‌روزرسانی
          </button>
        }
      >
        <RevenueChart points={dashboard.revenue_trend} />
      </AdminPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="صف‌های در انتظار مدیر" action={
          <span className="text-[11px] text-fg-subtle">نیازمند اقدام</span>
        }>
          <ul className="list-none space-y-2 p-0 text-xs">
            {[
              { label: 'فروشگاه‌های در انتظار تأیید', value: queues.vendors, to: '/admin/vendors' },
              { label: 'کالاهای در انتظار تأیید', value: queues.products, to: '/admin/products' },
              { label: 'سفارش‌های پرداخت‌نشده', value: queues.unpaid_orders, to: '/admin/orders' },
            ].map((row) => (
              <li key={row.label}>
                <Link
                  to={row.to}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2.5 transition hover:border-line-strong"
                >
                  <span className="text-fg-muted">{row.label}</span>
                  <span className="tabular-nums text-fg">{faNum(row.value)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </AdminPanel>

        <AdminPanel title="وضعیت سفارش‌ها">
          <ul className="list-none space-y-2 p-0 text-xs">
            {dashboard.order_status_breakdown.map((row) => (
              <li key={row.status} className="flex items-center justify-between gap-2">
                <StatusPill status={row.status} label={adminOrderStatusLabel(row.status)} />
                <span className="tabular-nums text-fg-muted">{faNum(row.count)}</span>
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="فروشگاه‌های برتر">
          {dashboard.top_vendors.length === 0 ? (
            <p className="text-xs text-fg-subtle">هنوز فروشی ثبت نشده است.</p>
          ) : (
            <ul className="list-none space-y-2 p-0 text-xs">
              {dashboard.top_vendors.map((row, index) => (
                <li
                  key={row.vendor?.id ?? index}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2.5"
                >
                  <span className="text-fg">{row.vendor?.store_name ?? 'فروشگاه حذف‌شده'}</span>
                  <span className="text-[11px] text-fg-subtle">
                    {faNum(row.orders)} زیرسفارش • کمیسیون {faPrice(row.commission)}
                  </span>
                  <span className="tabular-nums text-fg">{faPrice(row.gross)}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel
          title="آخرین سفارش‌ها"
          action={
            <Link to="/admin/orders" className="text-[11px] text-brand hover:text-brand">
              همه‌ی سفارش‌ها
            </Link>
          }
        >
          {dashboard.recent_orders.length === 0 ? (
            <p className="text-xs text-fg-subtle">سفارشی ثبت نشده است.</p>
          ) : (
            <ul className="list-none space-y-2 p-0 text-xs">
              {dashboard.recent_orders.map((row) => (
                <li
                  key={row.id}
                  className="card px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="tabular-nums text-fg">{row.order_number}</span>
                    <span className="tabular-nums text-fg">{faPrice(row.grand_total)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusPill status={row.status} label={adminOrderStatusLabel(row.status)} />
                    <span className="text-[11px] text-fg-subtle">
                      پرداخت: {paymentStatusLabel(row.payment_status)}
                    </span>
                    <span className="text-[11px] text-fg-subtle">
                      {row.customer?.name ?? 'مشتری حذف‌شده'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </div>
  )
}
