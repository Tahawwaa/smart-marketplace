import { useState } from 'react'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faNum } from '../../lib/format'
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
  ADMIN_VENDOR_STATUS_LABELS,
  adminVendorStatusLabel,
  fetchAdminVendors,
  updateAdminVendor,
  updateAdminVendorStatus,
} from './api'

const FILTERS = ['', ...Object.keys(ADMIN_VENDOR_STATUS_LABELS)]

export function AdminVendorsPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [commission, setCommission] = useState('')

  const key = `${status}#${search}#${page}`
  const vendors = useAsync(
    (signal) => fetchAdminVendors({ status: status || undefined, search: search || undefined, page }, signal),
    key,
  )

  const rows = vendors.data?.data ?? []
  const meta = vendors.data?.meta

  async function changeStatus(id: number, next: string) {
    setBusyId(id)
    setError(null)
    try {
      await updateAdminVendorStatus(id, next)
      vendors.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر وضعیت فروشگاه انجام نشد.')
    } finally {
      setBusyId(null)
    }
  }

  async function saveCommission(id: number) {
    const value = Number(commission)
    if (!Number.isFinite(value)) {
      setError('نرخ کمیسیون باید عدد باشد.')
      return
    }

    setBusyId(id)
    setError(null)
    try {
      await updateAdminVendor(id, { commission_rate: value })
      setEditing(null)
      vendors.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ثبت کمیسیون انجام نشد.')
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
        placeholder="جست‌وجوی نام یا نشانی فروشگاه…"
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
                {value === '' ? 'همه' : adminVendorStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </AdminToolbar>

      {error ? <AdminError message={error} /> : null}

      <AdminPanel
        title="فروشگاه‌ها"
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
        {vendors.loading ? (
          <AdminLoading />
        ) : vendors.error ? (
          <AdminError message={vendors.error} />
        ) : rows.length === 0 ? (
          <AdminEmpty message="فروشگاهی با این شرایط پیدا نشد." />
        ) : (
          <ul className="list-none space-y-2 p-0">
            {rows.map((row) => (
              <li key={row.id} className="card px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-fg">{row.store_name}</span>
                  <StatusPill status={row.status} label={adminVendorStatusLabel(row.status)} />
                </div>

                <p className="mt-1 text-fg-subtle">
                  {row.user ? `${row.user.name} • ${row.user.email}` : 'بدون کاربر متناظر'}
                </p>

                <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-fg-muted">
                  <div className="flex gap-1">
                    <dt>کمیسیون:</dt>
                    <dd className="tabular-nums text-fg">{faNum(row.commission_rate)}٪</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>کالا:</dt>
                    <dd className="tabular-nums text-fg">{faNum(row.products_count ?? 0)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>قلم موجودی:</dt>
                    <dd className="tabular-nums text-fg">{faNum(row.inventories_count ?? 0)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>شبا:</dt>
                    <dd className="tabular-nums text-fg">{row.bank_sheba ?? 'ثبت نشده'}</dd>
                  </div>
                </dl>

                {editing === row.id ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      value={commission}
                      onChange={(event) => setCommission(event.target.value)}
                      inputMode="decimal"
                      className="w-24 input tabular-nums"
                      placeholder="٪"
                    />
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void saveCommission(row.id)}
                      className="alert alert-info"
                    >
                      ثبت کمیسیون
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="btn btn-secondary btn-sm"
                    >
                      انصراف
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.status !== 'approved' ? (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void changeStatus(row.id, 'approved')}
                        className="alert alert-success"
                      >
                        تأیید فروشگاه
                      </button>
                    ) : null}
                    {row.status !== 'suspended' ? (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void changeStatus(row.id, 'suspended')}
                        className="alert alert-warning"
                      >
                        تعلیق
                      </button>
                    ) : null}
                    {row.status !== 'rejected' ? (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void changeStatus(row.id, 'rejected')}
                        className="btn btn-danger btn-sm"
                      >
                        رد
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(row.id)
                        setCommission(String(row.commission_rate))
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      ویرایش کمیسیون
                    </button>
                  </div>
                )}

                {row.approved_at ? (
                  <p className="mt-2 text-[11px] text-fg-subtle">
                    تاریخ تأیید: {new Date(row.approved_at).toLocaleDateString('fa-IR')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  )
}
