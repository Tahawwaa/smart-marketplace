import { Link } from 'react-router-dom'
import { Pager } from '../../components/ui/pager'
import { useAsync } from '../../hooks/use-async'
import { faNum, faPrice } from '../../lib/format'
import { fetchVendorOrders, subOrderStatusLabel } from './api'
import { paymentStatusLabel } from '../payments/api'
import { useVendorFilters } from './use-vendor-filters'
import { VendorEmpty, VendorError, VendorLoading, VendorPageHeading, VendorSearch, VendorStatus } from './vendor-ui'

export function VendorOrdersPage() {
  const filters = useVendorFilters()
  const status = filters.params.get('status') ?? ''
  const payment = filters.params.get('payment_status') ?? ''
  const orders = useAsync((signal) => fetchVendorOrders(status, signal, filters.page, { search: filters.search, payment_status: payment }), `vendor-orders-${filters.params}`)
  const rows = orders.data?.data ?? []
  return <div className="space-y-5">
    <VendorPageHeading title="سفارش‌های فروشگاه" description="پرداخت‌ها را بررسی کنید، سفارش‌ها را آماده کنید و مسیر تحویل را پیگیری کنید." />
    <form onSubmit={filters.apply} className="flex flex-wrap gap-2 rounded-2xl border border-line bg-surface p-3"><VendorSearch value={filters.search} placeholder="شماره سفارش یا نام مشتری" /><select key={status} name="status" defaultValue={status} aria-label="وضعیت سفارش" className="select !w-auto text-xs"><option value="">همه سفارش‌ها</option>{['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((value) => <option key={value} value={value}>{subOrderStatusLabel(value)}</option>)}</select><select key={payment} name="payment_status" defaultValue={payment} aria-label="وضعیت پرداخت" className="select !w-auto text-xs"><option value="">همه پرداخت‌ها</option>{['paid', 'pending', 'failed', 'refunded', 'partially_refunded'].map((value) => <option key={value} value={value}>{paymentStatusLabel(value)}</option>)}</select><button className="btn btn-secondary btn-sm">اعمال فیلتر</button>{filters.search || status || payment ? <button type="button" onClick={filters.reset} className="btn btn-ghost btn-sm">پاک کردن</button> : null}</form>
    {orders.loading ? <VendorLoading /> : orders.error ? <VendorError message={orders.error} retry={orders.retry} /> : !rows.length ? <VendorEmpty title="سفارشی پیدا نشد" description="با تغییر فیلترها دوباره بررسی کنید. سفارش‌های جدید اینجا نمایش داده می‌شوند." /> : <div className="space-y-3">{rows.map((row) => <article key={row.id} className="card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><Link to={`/vendor/orders/${row.id}`} className="text-sm font-bold text-fg hover:text-brand">{row.sub_order_number}</Link><p className="mt-1 text-[11px] text-fg-subtle">{row.created_at ? new Date(row.created_at).toLocaleDateString('fa-IR') : '—'} · {row.order?.user?.name ?? 'مشتری'}</p></div><VendorStatus status={row.status} order /></div><div className="mt-5 grid gap-3 border-t border-line pt-4 min-[450px]:grid-cols-3"><div><p className="text-[10px] text-fg-subtle">پرداخت مشتری</p><p className="mt-1 text-xs font-bold text-fg">{paymentStatusLabel(row.order?.payment_status ?? 'pending')}</p></div><div><p className="text-[10px] text-fg-subtle">اقلام سفارش</p><p className="mt-1 text-xs font-bold text-fg">{faNum((row.items ?? []).reduce((sum, item) => sum + item.quantity, 0))} عدد</p></div><div><p className="text-[10px] text-fg-subtle">سهم فروشگاه</p><p className="mt-1 text-xs font-bold text-fg">{faPrice(row.vendor_net_amount)}</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-fg-muted">{row.order?.shipping_address_snapshot.city ?? '—'} · {row.items?.[0]?.product_name_snapshot ?? 'بدون کالا'}{(row.items?.length ?? 0) > 1 ? ` و ${faNum(row.items!.length - 1)} قلم دیگر` : ''}</p><Link to={`/vendor/orders/${row.id}`} className="btn btn-secondary btn-sm">جزئیات و پیگیری</Link></div></article>)}</div>}
    {orders.data?.meta ? <Pager page={filters.page} lastPage={orders.data.meta.last_page} total={orders.data.meta.total} onChange={filters.setPage} /> : null}
  </div>
}
