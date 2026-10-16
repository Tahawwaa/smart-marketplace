import {
  AlertTriangle,
  ArrowLeft,
  BadgeDollarSign,
  Boxes,
  CalendarDays,
  ClipboardCheck,
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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-fg p-5 text-bg shadow-[var(--shadow-md)] sm:p-6">
          <div className="pointer-events-none absolute -end-16 -top-20 size-52 rounded-full bg-brand/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 start-1/3 size-48 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] text-bg/65">
              <CalendarDays className="size-4" />
              نمای کلی عملکرد امروز
            </div>
            <h2 className="mt-4 max-w-lg text-xl font-black leading-8 sm:text-2xl">
              همه‌چیز برای تصمیم بعدی شما آماده است.
            </h2>
            <p className="mt-2 max-w-xl text-xs leading-7 text-bg/65 sm:text-sm">
              صف‌های نیازمند بررسی را ببینید و وضعیت سفارش‌های امروز را سریع‌تر مدیریت کنید.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/admin/orders" className="btn btn-secondary border-transparent bg-surface text-fg hover:bg-surface-2">
                بررسی سفارش‌ها
                <ArrowLeft className="size-4" />
              </Link>
              <Link to="/admin/vendors" className="btn btn-ghost text-bg/80 hover:bg-white/10 hover:text-bg">
                صف تأیید فروشگاه‌ها
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
          {[
            { label: 'فروشگاه‌های در انتظار', value: queues.vendors, to: '/admin/vendors', icon: Store, tone: 'bg-brand-soft text-brand-ink' },
            { label: 'کالاهای در انتظار', value: queues.products, to: '/admin/products', icon: Boxes, tone: 'bg-warning-soft text-warning-ink' },
            { label: 'سفارش‌های پرداخت‌نشده', value: queues.unpaid_orders, to: '/admin/orders', icon: ClipboardCheck, tone: 'bg-info-soft text-info-ink' },
            { label: 'موجودی کم', value: cards.low_stock_variants, to: '/admin/products', icon: AlertTriangle, tone: 'bg-danger-soft text-danger-ink' },
          ].map((item) => (
            <Link key={item.label} to={item.to} className="card card-hover flex items-center gap-3 p-4">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.tone}`}>
                <item.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] text-fg-subtle">{item.label}</span>
                <span className="mt-1 block text-xl font-black tabular-nums text-fg">{faNum(item.value)}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
