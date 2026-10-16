import { useState } from 'react'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faNum, faPrice } from '../../lib/format'
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
  ADMIN_PRODUCT_STATUS_LABELS,
  adminProductStatusLabel,
  fetchAdminProducts,
  updateAdminProductStatus,
} from './api'

const FILTERS = ['', ...Object.keys(ADMIN_PRODUCT_STATUS_LABELS)]

export function AdminProductsPage() {
  const [status, setStatus] = useState('pending')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const key = `${status}#${search}#${page}`
  const products = useAsync(
    (signal) => fetchAdminProducts({ status: status || undefined, search: search || undefined, page }, signal),
    key,
  )

  const rows = products.data?.data ?? []
  const meta = products.data?.meta

  async function decide(id: number, next: 'approved' | 'rejected') {
    setBusyId(id)
    setError(null)
    try {
      await updateAdminProductStatus(id, next)
      products.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر وضعیت کالا انجام نشد.')
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
        placeholder="جست‌وجوی نام کالا…"
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
                {value === '' ? 'همه' : adminProductStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </AdminToolbar>

      {error ? <AdminError message={error} /> : null}

      <AdminPanel
        title="کالاها"
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
        {products.loading ? (
          <AdminLoading />
        ) : products.error ? (
          <AdminError message={products.error} />
        ) : rows.length === 0 ? (
          <AdminEmpty message="کالایی با این شرایط پیدا نشد." />
        ) : (
          <ul className="list-none space-y-2 p-0">
            {rows.map((row) => (
              <li key={row.id} className="card px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-fg">{row.name}</span>
                  <div className="flex items-center gap-2">
                    {row.is_active ? null : (
                      <span className="badge badge-neutral">
                        پنهان از فروشگاه
                      </span>
                    )}
                    <StatusPill status={row.status} label={adminProductStatusLabel(row.status)} />
                  </div>
                </div>

                <p className="mt-1 text-fg-subtle">
                  {row.vendor?.store_name ?? 'بدون فروشنده'} • {row.category?.name ?? 'بدون دسته‌بندی'}
                  {row.brand ? ` • ${row.brand.name}` : ''}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {row.status !== 'approved' ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void decide(row.id, 'approved')}
                      className="alert alert-success"
                    >
                      تأیید و انتشار
                    </button>
                  ) : null}
                  {row.status !== 'rejected' ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void decide(row.id, 'rejected')}
                      className="btn btn-danger btn-sm"
                    >
                      رد
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    {expanded === row.id ? 'بستن جزئیات' : 'جزئیات'}
                  </button>
                </div>

                {expanded === row.id ? (
                  <div className="mt-3 space-y-2 border-t border-line pt-3">
                    <p className="text-fg-subtle">
                      نشانی: <span className="tabular-nums text-fg-muted">/{row.slug}</span>
                    </p>
                    {row.description ? (
                      <p className="text-start leading-6 text-fg-muted">{row.description}</p>
                    ) : (
                      <p className="text-fg-subtle">توضیحی ثبت نشده است.</p>
                    )}
                    <ul className="list-none space-y-1 p-0 text-fg-muted">
                      {(row.variants ?? []).map((variant) => (
                        <li key={variant.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span className="tabular-nums">{variant.sku ?? 'بدون کد'}</span>
                          <span className="tabular-nums">
                            {faPrice(variant.inventories?.[0]?.effective_price ?? 0)} • موجودی:{' '}
                            {faNum(variant.inventories?.[0]?.available_quantity ?? 0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  )
}
