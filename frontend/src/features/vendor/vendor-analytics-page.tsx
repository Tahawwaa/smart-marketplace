import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAsync } from '../../hooks/use-async'
import { cn } from '../../lib/cn'
import { faNum, faPrice } from '../../lib/format'
import { downloadVendorOrdersCsv, fetchVendorAnalytics, subOrderStatusLabel } from './api'

const PERIODS = [7, 30, 90]

export function VendorAnalyticsPage() {
  const [days, setDays] = useState(30)
  const [exportError, setExportError] = useState<string | null>(null)
  const analytics = useAsync((signal) => fetchVendorAnalytics(days, signal), `vendor-analytics-${days}`)
  const data = analytics.data?.data

  async function exportCsv() {
    setExportError(null)
    try {
      await downloadVendorOrdersCsv()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'خطا در دریافت فایل.')
    }
  }

  if (analytics.loading && !data) {
    return (
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری…
      </p>
    )
  }

  if (!data) {
    return <p className="text-sm text-fg-muted">{analytics.error ?? 'گزارشی در دسترس نیست.'}</p>
  }

  const maxRevenue = Math.max(...data.daily.map((day) => day.revenue), 1)
  const barWidth = 100 / data.daily.length
  const cards = [
    { label: 'فروش', value: faPrice(data.totals.revenue) },
    { label: 'سهم خالص شما', value: faPrice(data.totals.net) },
    { label: 'کمیسیون', value: faPrice(data.totals.commission) },
    { label: 'تعداد سفارش', value: faNum(data.totals.orders) },
    { label: 'میانگین سفارش', value: faPrice(data.totals.average_order_value) },
    { label: 'تسویه‌نشده / تسویه‌شده', value: `${faPrice(data.payouts.pending)} / ${faPrice(data.payouts.paid)}` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDays(period)}
              className={cn('chip', days === period && 'border-brand bg-brand text-brand-fg')}
            >
              {faNum(period)} روز اخیر
            </button>
          ))}
        </div>
        <button type="button" onClick={exportCsv} className="btn btn-secondary w-full sm:w-auto">
          <Download className="size-4" />
          خروجی CSV سفارش‌ها
        </button>
      </div>
      {exportError && <p className="text-xs text-danger">{exportError}</p>}

      <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="card px-4 py-3">
            <dt className="text-fg-subtle">{card.label}</dt>
            <dd className="mt-1 tabular-nums text-fg">{card.value}</dd>
          </div>
        ))}
      </dl>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-fg">روند فروش روزانه</h2>
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-40 w-full" role="img" aria-label="نمودار فروش روزانه">
          {data.daily.map((day, index) => {
            const height = (day.revenue / maxRevenue) * 38
            return (
              <rect
                key={day.date}
                x={index * barWidth + barWidth * 0.15}
                y={40 - height}
                width={barWidth * 0.7}
                height={height}
                rx={0.4}
                className="fill-brand"
              >
                <title>{`${day.date}: ${faPrice(day.revenue)}`}</title>
              </rect>
            )
          })}
        </svg>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-bold text-fg">پرفروش‌ترین کالاها</h2>
          {data.top_products.length === 0 ? (
            <p className="text-xs text-fg-subtle">هنوز فروشی ثبت نشده است.</p>
          ) : (
            <ul className="list-none space-y-2 p-0 text-xs">
              {data.top_products.map((item) => (
                <li key={item.name} className="flex justify-between gap-2">
                  <span className="truncate text-fg">{item.name}</span>
                  <span className="shrink-0 tabular-nums text-fg-muted">
                    {faNum(item.units)} عدد • {faPrice(item.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-bold text-fg">هشدار موجودی کم</h2>
          {data.low_stock.length === 0 ? (
            <p className="text-xs text-fg-subtle">موجودی همه‌ی اقلام کافی است.</p>
          ) : (
            <ul className="list-none space-y-2 p-0 text-xs">
              {data.low_stock.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="truncate text-fg">{item.name ?? item.sku ?? `#${item.id}`}</span>
                  <span className="shrink-0 tabular-nums text-fg-muted">{faNum(item.available_quantity)} عدد</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-fg">وضعیت سفارش‌ها</h2>
        <ul className="flex list-none flex-wrap gap-2 p-0 text-xs">
          {Object.entries(data.status_counts).map(([status, total]) => (
            <li key={status} className="chip">
              {subOrderStatusLabel(status)}: {faNum(total)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
