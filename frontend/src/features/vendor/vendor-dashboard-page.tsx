import { ArrowDownLeft, ArrowUpLeft, Boxes, Coins, PackageCheck, Plus, Truck, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../hooks/use-async'
import { faNum, faPrice } from '../../lib/format'
import { fetchVendorOrders, fetchVendorAnalytics } from './api'
import { SalesChart, VendorEmpty, VendorError, VendorLoading, VendorPageHeading, VendorSectionLink, VendorStatus } from './vendor-ui'

export function VendorDashboardPage() {
  const analytics = useAsync((signal) => fetchVendorAnalytics(30, signal), 'vendor-dashboard-analytics')
  const orders = useAsync((signal) => fetchVendorOrders('', signal, 1, { per_page: 5 }), 'vendor-dashboard-orders')
  const summary = analytics.data?.data
  const rows = orders.data?.data ?? []
  if (analytics.loading || orders.loading) return <VendorLoading />
  if (!summary || analytics.error || orders.error) return <VendorError message={analytics.error ?? orders.error ?? 'اطلاعات دریافت نشد.'} retry={() => { analytics.retry(); orders.retry() }} />
  const change = summary.revenue_change_percent
  const metrics = [
    { title: 'فروش ۳۰ روز اخیر', value: faPrice(summary.totals.revenue), icon: Coins, hint: `${faNum(summary.totals.orders)} سفارش پرداخت‌شده` },
    { title: 'سهم خالص فروش', value: faPrice(summary.totals.net), icon: Wallet, hint: 'پس از کسر کمیسیون؛ پیش از تسویه' },
    { title: 'نیازمند آماده‌سازی', value: faNum(summary.fulfillment.to_prepare), icon: PackageCheck, hint: 'سفارش‌های پرداخت‌شدهٔ باز', to: '/vendor/orders?status=confirmed' },
    { title: 'در مسیر مشتری', value: faNum(summary.fulfillment.in_transit), icon: Truck, hint: 'سفارش‌های ارسال‌شده', to: '/vendor/orders?status=shipped' },
  ]
  return <div className="space-y-5">
    <VendorPageHeading title="نبض فروشگاه شما" description="فروش، سفارش‌ها و کارهایی که امروز نیاز به توجه دارند." />
    <dl className="grid gap-3 min-[450px]:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <div key={metric.title} className="card p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><dt className="text-[11px] text-fg-muted">{metric.title}</dt><metric.icon className="size-4 text-brand" /></div><dd className="mt-4 break-words text-lg font-black tabular-nums text-fg">{metric.value}</dd><p className="mt-2 text-[10px] leading-5 text-fg-subtle">{metric.hint}</p>{metric.to ? <div className="mt-3"><VendorSectionLink to={metric.to}>مشاهده سفارش‌ها</VendorSectionLink></div> : null}</div>)}</dl>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]"><div className="space-y-3"><SalesChart daily={summary.daily} /><p className="flex items-center gap-2 px-2 text-xs text-fg-muted">{change === null ? 'مقایسه پس از ثبت فروش در دورهٔ قبل نمایش داده می‌شود.' : <><span className={change >= 0 ? 'text-success-ink' : 'text-danger-ink'}>{change >= 0 ? <ArrowUpLeft className="inline size-4" /> : <ArrowDownLeft className="inline size-4" />} {faNum(Math.abs(change))}٪</span>{change >= 0 ? 'افزایش' : 'کاهش'} فروش نسبت به ۳۰ روز قبل</>}</p></div>
      <section className="card p-5"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-fg">کارهای پیش رو</h3><Boxes className="size-4 text-fg-subtle" /></div><div className="mt-5 space-y-3">{[
        { label: 'کالاهای در انتظار تأیید', count: summary.catalog.pending_products, to: '/vendor/products?status=pending', hint: 'پیگیری وضعیت انتشار کالاها' },
        { label: 'اقلام ناموجود', count: summary.catalog.out_of_stock, to: '/vendor/inventory?stock=out', hint: 'بررسی و تأمین مجدد موجودی' },
        { label: 'همهٔ کالاهای فروشگاه', count: summary.catalog.products, to: '/vendor/products', hint: 'ویرایش اطلاعات و مدیریت کالاها' },
      ].map((item) => <Link key={item.to} to={item.to} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 transition hover:border-brand/40 hover:bg-brand-soft"><div><p className="text-xs font-bold text-fg">{item.label}</p><p className="mt-1 text-[10px] text-fg-subtle">{item.hint}</p></div><span className="text-lg font-black tabular-nums text-brand">{faNum(item.count)}</span></Link>)}</div><Link to="/vendor/products/new" className="btn btn-primary mt-5 w-full text-xs"><Plus className="size-4" />افزودن کالای جدید</Link></section></div>
    <section className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5"><h3 className="text-sm font-bold text-fg">آخرین سفارش‌ها</h3><VendorSectionLink to="/vendor/orders">همه سفارش‌ها</VendorSectionLink></div>{rows.length ? <div className="overflow-x-auto"><table className="w-full text-start text-xs"><thead className="bg-surface-2 text-fg-subtle"><tr>{['سفارش', 'مشتری', 'وضعیت', 'سهم فروشگاه', ''].map((label, i) => <th key={i} className="px-5 py-3 text-start font-medium">{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-line"><td className="whitespace-nowrap px-5 py-4 font-bold text-fg">{row.sub_order_number}</td><td className="px-5 py-4 text-fg-muted">{row.order?.user?.name ?? '—'}</td><td className="px-5 py-4"><VendorStatus status={row.status} order /></td><td className="whitespace-nowrap px-5 py-4 tabular-nums text-fg">{faPrice(row.vendor_net_amount)}</td><td className="px-5 py-4"><VendorSectionLink to={`/vendor/orders/${row.id}`}>جزئیات</VendorSectionLink></td></tr>)}</tbody></table></div> : <VendorEmpty title="اولین سفارش در راه است" description="با افزودن کالا و تکمیل موجودی، ویترین فروشگاهتان را آماده کنید." />}</section>
  </div>
}
