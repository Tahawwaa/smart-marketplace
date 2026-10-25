import { ArrowRight, Clock3, MapPin, Save } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faNum, faPrice } from '../../lib/format'
import type { VendorSubOrder } from '../../types/api'
import { paymentStatusLabel } from '../payments/api'
import { fetchVendorOrder, subOrderStatusLabel, updateVendorSubOrderStatus, VENDOR_SUB_ORDER_STATUSES } from './api'
import { VendorError, VendorLoading, VendorPageHeading, VendorStatus } from './vendor-ui'

export function VendorOrderDetailPage() {
  const { id } = useParams()
  const order = useAsync((signal) => fetchVendorOrder(Number(id), signal), `vendor-order-${id}`)
  if (order.loading) return <VendorLoading />
  if (order.error || !order.data) return <VendorError message={order.error ?? 'سفارش پیدا نشد.'} retry={order.retry} />
  return <OrderDetail key={`${id}-${order.data.data.status}`} row={order.data.data} refresh={order.retry} />
}

function OrderDetail({ row, refresh }: { row: VendorSubOrder; refresh: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const progression: readonly string[] = ['pending', ...VENDOR_SUB_ORDER_STATUSES]
  const next = progression.includes(row.status) ? VENDOR_SUB_ORDER_STATUSES.slice(progression.indexOf(row.status)) : []
  const paid = ['paid', 'partially_refunded'].includes(row.order?.payment_status ?? '')
  const address = row.order?.shipping_address_snapshot
  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true); setError(null)
    try { await updateVendorSubOrderStatus(row.id, String(form.get('status')), String(form.get('note') ?? '').trim() || undefined); refresh() }
    catch (cause) { setError(cause instanceof ApiError ? Object.values(cause.errors ?? {})[0]?.[0] ?? cause.message : 'تغییر وضعیت انجام نشد.') }
    finally { setBusy(false) }
  }
  return <div className="space-y-5"><Link to="/vendor/orders" className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-brand"><ArrowRight className="size-4" />همه سفارش‌ها</Link><VendorPageHeading title={row.sub_order_number} description={`سفارش ${row.order?.order_number ?? '—'} · ${row.created_at ? new Date(row.created_at).toLocaleString('fa-IR') : ''}`} action={<VendorStatus status={row.status} order />} />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"><div className="space-y-5"><section className="card p-5"><h3 className="mb-4 text-sm font-bold text-fg">اقلام سفارش</h3><ul className="divide-y divide-line">{row.items?.map((item) => <li key={item.id} className="flex items-start justify-between gap-4 py-4"><div><p className="text-xs font-bold leading-6 text-fg">{item.product_name_snapshot}</p><p className="mt-1 text-[11px] text-fg-subtle"><bdi>{item.variant_sku_snapshot}</bdi> · {faNum(item.quantity)} عدد</p></div><span className="shrink-0 text-xs text-fg">{faPrice(item.total_price)}</span></li>)}</ul><dl className="mt-3 space-y-3 border-t border-line pt-4 text-xs">{[['جمع کالاها', row.subtotal_price], ['هزینه ارسال', row.shipping_fee], ['کمیسیون', row.commission_amount], ['سهم فروشگاه', row.vendor_net_amount]].map(([label, value]) => <div key={label} className="flex justify-between"><dt className="text-fg-muted">{label}</dt><dd className="font-bold text-fg">{faPrice(Number(value))}</dd></div>)}</dl></section>
    <section className="card p-5"><h3 className="flex items-center gap-2 text-sm font-bold text-fg"><MapPin className="size-4 text-brand" />اطلاعات تحویل</h3><p className="mt-4 text-xs font-bold text-fg">{address?.recipient_name ?? row.order?.user?.name ?? '—'}</p><p className="mt-2 text-xs leading-7 text-fg-muted">{[address?.province, address?.city, address?.address_line].filter(Boolean).join('، ') || 'نشانی ثبت نشده است.'}</p><div className="mt-3 flex flex-wrap gap-5 text-xs text-fg-muted"><span>تلفن: <bdi>{address?.recipient_phone ?? '—'}</bdi></span><span>کد پستی: <bdi>{address?.postal_code ?? '—'}</bdi></span></div></section></div>
    <div className="space-y-5"><section className="card p-5"><h3 className="text-sm font-bold text-fg">پیگیری سفارش</h3><p className="my-4 rounded-xl bg-surface-2 p-3 text-xs text-fg-muted">پرداخت: <strong className="text-fg">{paymentStatusLabel(row.order?.payment_status ?? 'pending')}</strong></p>{paid && next.length ? <form onSubmit={update} className="space-y-4"><label className="block text-xs text-fg-muted">وضعیت جدید<select name="status" required className="select mt-2">{next.map((status) => <option key={status} value={status}>{subOrderStatusLabel(status)}</option>)}</select></label><label className="block text-xs text-fg-muted">یادداشت پیگیری (اختیاری)<textarea name="note" maxLength={1000} rows={3} className="input mt-2" placeholder="مثلاً توضیحات آماده‌سازی یا ارسال" /></label><button disabled={busy} className="btn btn-primary btn-sm w-full"><Save className="size-4" />{busy ? 'در حال ثبت…' : 'ثبت وضعیت'}</button></form> : <p className="text-xs leading-6 text-fg-subtle">{!paid ? 'تغییر وضعیت ارسال پس از تأیید پرداخت مشتری در دسترس است.' : 'این سفارش به مرحله نهایی رسیده است.'}</p>}{error ? <p role="alert" className="alert alert-danger mt-3">{error}</p> : null}</section>
    <section className="card p-5"><h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-fg"><Clock3 className="size-4 text-brand" />تاریخچه وضعیت</h3>{row.history?.length ? <ol className="space-y-5 border-s border-line ps-4">{row.history.map((entry) => <li key={entry.id} className="relative"><span className="absolute -start-[21px] top-1 size-2.5 rounded-full border-2 border-surface bg-brand" /><p className="text-xs font-bold text-fg">{subOrderStatusLabel(entry.to_status)}</p><time className="mt-1 block text-[10px] text-fg-subtle">{entry.created_at ? new Date(entry.created_at).toLocaleString('fa-IR') : '—'}</time>{entry.note ? <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-fg-muted">{entry.note}</p> : null}</li>)}</ol> : <p className="text-xs text-fg-subtle">هنوز تغییری ثبت نشده است.</p>}</section></div></div>
  </div>
}
