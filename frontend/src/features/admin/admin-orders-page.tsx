import { useState } from 'react'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faNum, faPrice } from '../../lib/format'
import { paymentStatusLabel } from '../payments/api'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPanel,
  AdminToolbar,
  Pager,
  StatusPill,
} from './admin-ui'
import {
  ADMIN_ORDER_STATUS_LABELS,
  ADMIN_ORDER_TERMINAL_STATUSES,
  adminOrderStatusLabel,
  fetchAdminOrders,
  updateAdminOrderStatus,
} from './api'

const FILTERS = ['', ...Object.keys(ADMIN_ORDER_STATUS_LABELS)]

export function AdminOrdersPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const key = `${status}#${search}#${page}`
  const orders = useAsync(
    (signal) => fetchAdminOrders({ status: status || undefined, search: search || undefined, page }, signal),
    key,
  )

  const rows = orders.data?.data ?? []
  const meta = orders.data?.meta

  /** لغو و بازگشت وجه روی همه‌ی زیرسفارش‌ها اعمال می‌شود، پس تأیید می‌گیریم. */
  async function terminate(id: number, next: string) {
    const label = adminOrderStatusLabel(next)
    if (!window.confirm(`سفارش و همه‌ی زیرسفارش‌های آن به «${label}» تغییر کند؟`)) return

    setBusyId(id)
    setError(null)
    try {
      await updateAdminOrderStatus(id, next)
      orders.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر وضعیت سفارش انجام نشد.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-3">
      <AdminToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        placeholder="جست‌وجوی شماره سفارش…"
      >
        <label className="flex items-center gap-2 text-fg-muted">
          وضعیت
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className="input"
          >
            {FILTERS.map((value) => (
              <option key={value || 'all'} value={value}>
                {value === '' ? 'همه' : adminOrderStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </AdminToolbar>

      {error ? <AdminError message={error} /> : null}

      <AdminPanel
        title="سفارش‌ها"
        action={
          meta ? (
            <Pager
              page={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              onChange={setPage}
            />
          ) : null
        }
      >
        {orders.loading ? (
          <AdminLoading />
        ) : orders.error ? (
          <AdminError message={orders.error} />
        ) : rows.length === 0 ? (
          <AdminEmpty message="سفارشی با این شرایط پیدا نشد." />
        ) : (
          <ul className="list-none space-y-2 p-0">
            {rows.map((row) => {
              const address = row.shipping_address_snapshot
              const terminal = ADMIN_ORDER_TERMINAL_STATUSES.includes(
                row.status as (typeof ADMIN_ORDER_TERMINAL_STATUSES)[number],
              )

              return (
                <li key={row.id} className="card px-4 py-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="tabular-nums text-sm text-fg">{row.order_number}</span>
                    <StatusPill status={row.status} label={adminOrderStatusLabel(row.status)} />
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-fg-subtle">
                    <span>{row.user ? `${row.user.name} • ${row.user.email}` : 'مشتری حذف‌شده'}</span>
                    <span>پرداخت: {paymentStatusLabel(row.payment_status)}</span>
                    <span className="tabular-nums">
                      {faPrice(row.grand_total)} • {faNum(row.items_count ?? 0)} زیرسفارش
                    </span>
                    <span>
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString('fa-IR')
                        : '—'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      {expanded === row.id ? 'بستن جزئیات' : 'جزئیات'}
                    </button>
                    {!terminal ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void terminate(row.id, 'cancelled')}
                          className="btn btn-danger btn-sm"
                        >
                          لغو سفارش
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void terminate(row.id, 'refunded')}
                          className="alert alert-info"
                        >
                          بازگشت وجه
                        </button>
                      </>
                    ) : (
                      <span className="self-center text-[11px] text-fg-subtle">
                        این سفارش در وضعیت پایانی است.
                      </span>
                    )}
                  </div>

                  {expanded === row.id ? (
                    <div className="mt-3 space-y-2 border-t border-line pt-3">
                      {address ? (
                        <p className="text-start text-fg-muted">
                          گیرنده: {address.recipient_name} — {address.recipient_phone}
                          <br />
                          {address.province}، {address.city}، {address.address_line}
                        </p>
                      ) : null}

                      <ul className="list-none space-y-2 p-0">
                        {(row.sub_orders ?? []).map((subOrder) => (
                          <li
                            key={subOrder.id}
                            className="btn btn-secondary btn-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="tabular-nums text-fg">
                                {subOrder.sub_order_number}
                              </span>
                              <StatusPill
                                status={subOrder.status}
                                label={adminOrderStatusLabel(subOrder.status)}
                              />
                            </div>
                            <p className="mt-1 text-[11px] text-fg-subtle">
                              {subOrder.vendor?.store_name ?? 'فروشگاه حذف‌شده'} • کمیسیون{' '}
                              {faPrice(subOrder.commission_amount)}
                            </p>
                            <ul className="mt-1 list-none space-y-1 p-0 text-[11px]">
                              {(subOrder.items ?? []).map((item) => (
                                <li key={item.id} className="flex justify-between gap-2 text-start">
                                  <span>
                                    {item.product_name_snapshot}
                                    {item.variant_sku_snapshot ? ` (${item.variant_sku_snapshot})` : ''} ×{' '}
                                    {faNum(item.quantity)}
                                  </span>
                                  <span className="tabular-nums">{faPrice(item.total_price)}</span>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </AdminPanel>
    </div>
  )
}
