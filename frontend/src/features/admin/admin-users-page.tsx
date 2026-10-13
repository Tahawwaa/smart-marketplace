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
  ADMIN_ROLE_LABELS,
  adminRoleLabel,
  adminVendorStatusLabel,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from './api'

const ROLES = ['', ...Object.keys(ADMIN_ROLE_LABELS)]

export function AdminUsersPage() {
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const key = `${role}#${search}#${page}`
  const users = useAsync(
    (signal) => fetchAdminUsers({ role: role || undefined, search: search || undefined, page }, signal),
    key,
  )

  const rows = users.data?.data ?? []
  const meta = users.data?.meta

  async function toggleActive(id: number, isActive: boolean) {
    setBusyId(id)
    setError(null)
    try {
      await updateAdminUser(id, { is_active: isActive })
      users.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر وضعیت حساب انجام نشد.')
    } finally {
      setBusyId(null)
    }
  }

  async function changeRole(id: number, next: string) {
    setBusyId(id)
    setError(null)
    try {
      await updateAdminUser(id, { role: next })
      users.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر نقش انجام نشد.')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: number, name: string) {
    if (!window.confirm(`حساب «${name}» حذف شود؟ این کار برگشت‌پذیر نیست.`)) return

    setBusyId(id)
    setError(null)
    try {
      await deleteAdminUser(id)
      users.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'حذف حساب انجام نشد.')
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
        placeholder="جست‌وجوی نام، ایمیل یا تلفن…"
      >
        <label className="flex items-center gap-2 text-neutral-400">
          نقش
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none"
          >
            {ROLES.map((value) => (
              <option key={value || 'all'} value={value}>
                {value === '' ? 'همه' : adminRoleLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </AdminToolbar>

      {error ? <AdminError message={error} /> : null}

      <AdminPanel
        title="کاربران"
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
        {users.loading ? (
          <AdminLoading />
        ) : users.error ? (
          <AdminError message={users.error} />
        ) : rows.length === 0 ? (
          <AdminEmpty message="کاربری با این شرایط پیدا نشد." />
        ) : (
          <ul className="list-none space-y-2 p-0">
            {rows.map((row) => (
              <li key={row.id} className="rounded-xl border border-white/[0.08] px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-white">{row.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-neutral-300">
                      {adminRoleLabel(row.role)}
                    </span>
                    <StatusPill
                      status={row.is_active ? 'active' : 'suspended'}
                      label={row.is_active ? 'فعال' : 'غیرفعال'}
                    />
                  </div>
                </div>

                <p className="mt-1 text-neutral-500">
                  <span dir="ltr" className="inline-block">{row.email}</span>
                  {row.phone ? ` • ${row.phone}` : ''}
                  {` • ${faNum(row.orders_count ?? 0)} سفارش`}
                </p>

                {row.vendors && row.vendors.length > 0 ? (
                  <p className="mt-1 text-neutral-500">
                    فروشگاه:{' '}
                    {row.vendors
                      .map((vendor) => `${vendor.store_name} (${adminVendorStatusLabel(vendor.status)})`)
                      .join('، ')}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void toggleActive(row.id, !row.is_active)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-neutral-300 transition hover:border-white/25 hover:text-white disabled:opacity-50"
                  >
                    {row.is_active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                  </button>

                  {ROLES.filter((value) => value !== '' && value !== row.role).map((value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void changeRole(row.id, value)}
                      className="rounded-lg border border-cyan-400/25 bg-cyan-400/[0.08] px-3 py-1.5 text-cyan-100 transition hover:border-cyan-400/40 disabled:opacity-50"
                    >
                      تبدیل به {adminRoleLabel(value)}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void remove(row.id, row.name)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-rose-200 transition hover:border-rose-400/40 disabled:opacity-50"
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  )
}
