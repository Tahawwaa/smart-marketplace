import { Pager } from '../../components/ui/pager'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faPrice } from '../../lib/format'
import {
  VENDOR_SUB_ORDER_STATUSES,
  fetchVendorOrders,
  subOrderStatusLabel,
  updateVendorSubOrderStatus,
} from './api'
import { paymentStatusLabel } from '../payments/api'

const FILTERS = ['', 'pending', ...VENDOR_SUB_ORDER_STATUSES, 'cancelled', 'refunded'] as const
const PROGRESS: readonly string[] = ['pending', ...VENDOR_SUB_ORDER_STATUSES]
const nextStatuses = (status: string) => PROGRESS.includes(status) ? VENDOR_SUB_ORDER_STATUSES.slice(PROGRESS.indexOf(status)) : []

export function VendorOrdersPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const orders = useAsync((signal) => fetchVendorOrders(status, signal, page), `vendor-orders-${status}-${page}`)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rows = orders.data?.data ?? []

  // تا پرداخت تأیید نشده، مشتری مالکی ندارد که کالا برایش فرستاده شود.
  const isUnpaid = (row: (typeof rows)[number]) => !['paid', 'partially_refunded'].includes(row.order?.payment_status ?? '')

  async function move(id: number, next: string) {
    setBusyId(id)
    setError(null)
    try {
      await updateVendorSubOrderStatus(id, next)
      orders.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر وضعیت انجام نشد.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <h2 className="text-sm font-bold text-fg">سفارش‌های فروشگاه</h2>
        <label className="flex w-full items-center gap-2 text-fg-muted sm:ms-auto sm:w-auto">
          وضعیت
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1) }}
            className="select !py-1.5 text-xs sm:!w-auto"
          >
            {FILTERS.map((value) => (
              <option key={value || 'all'} value={value}>
                {value === '' ? 'همه' : subOrderStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="alert alert-danger">
          {error}
        </p>
      ) : null}

      {orders.loading ? (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Loader2 className="size-4 animate-spin" />
          در حال بارگذاری…
        </p>
      ) : orders.error ? (
        <p className="text-sm text-fg-muted">{orders.error}</p>
      ) : rows.length === 0 ? (
        <p className="card px-4 py-12 text-center text-xs text-fg-subtle">
          سفارشی با این وضعیت وجود ندارد.
        </p>
      ) : (
        <ul className="list-none space-y-3 p-0">
          {rows.map((row) => {
            const address = row.order?.shipping_address_snapshot
            const unpaid = isUnpaid(row)

            return (
              <li key={row.id} className="card px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-fg">{row.sub_order_number}</span>
                  <span className="badge badge-neutral">
                    {subOrderStatusLabel(row.status)}
                  </span>
                </div>

                <p className="mt-1 text-fg-subtle">
                  سفارش {row.order?.order_number ?? '—'} • پرداخت:{' '}
                  {row.order ? paymentStatusLabel(row.order.payment_status) : '—'}
                </p>

                <ul className="mt-2 list-none space-y-1 p-0 text-fg-muted">
                  {(row.items ?? []).map((item) => (
                    <li key={item.id} className="flex justify-between gap-2 text-start">
                      <span className="min-w-0 break-words">
                        {item.product_name_snapshot}
                        {item.variant_sku_snapshot ? ` (${item.variant_sku_snapshot})` : ''} ×{' '}
                        {item.quantity}
                      </span>
                      <span className="shrink-0 tabular-nums">{faPrice(item.total_price)}</span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="panel-muted !p-3">
                    <dt className="text-fg-subtle">جمع کالاها</dt>
                    <dd className="mt-0.5 tabular-nums text-fg">
                      {faPrice(row.subtotal_price)}
                    </dd>
                  </div>
                  <div className="panel-muted !p-3">
                    <dt className="text-fg-subtle">کمیسیون</dt>
                    <dd className="mt-0.5 tabular-nums text-fg">
                      {faPrice(row.commission_amount)}
                    </dd>
                  </div>
                  <div className="panel-muted !p-3">
                    <dt className="text-fg-subtle">سهم شما</dt>
                    <dd className="mt-0.5 tabular-nums text-fg">
                      {faPrice(row.vendor_net_amount)}
                    </dd>
                  </div>
                </dl>

                {address ? (
                  <p className="mt-3 text-start text-fg-subtle">
                    گیرنده: {address.recipient_name} — {address.recipient_phone}
                    <br />
                    {address.province}، {address.city}، {address.address_line}
                  </p>
                ) : null}

                {unpaid ? (
                  <p className="mt-3 text-start text-warning-ink">
                    تا وقتی پرداخت مشتری تأیید نشود، مسیر این زیرسفارش با تأیید پرداخت آغاز می‌شود.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nextStatuses(row.status).map(
                      (value) => (
                        <button
                          key={value}
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void move(row.id, value)}
                          className="btn btn-secondary btn-sm"
                        >
                          {busyId === row.id ? '…' : `انتقال به ${subOrderStatusLabel(value)}`}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {orders.data?.meta ? <Pager page={page} lastPage={orders.data.meta.last_page} total={orders.data.meta.total} onChange={setPage} /> : null}
    </div>
  )
}
