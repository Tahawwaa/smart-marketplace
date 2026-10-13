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
  type BrandInput,
  createAdminBrand,
  deleteAdminBrand,
  fetchAdminBrands,
  updateAdminBrand,
} from './api'

type Form = {
  id: number | null
  name: string
  slug: string
  is_active: boolean
}

const EMPTY_FORM: Form = { id: null, name: '', slug: '', is_active: true }

export function AdminBrandsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const key = `${search}#${page}`
  const brands = useAsync(
    (signal) => fetchAdminBrands({ search: search || undefined, page }, signal),
    key,
  )

  const rows = brands.data?.data ?? []
  const meta = brands.data?.meta

  async function submit() {
    if (form.name.trim() === '') {
      setError('نام برند الزامی است.')
      return
    }

    const input: BrandInput = {
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      is_active: form.is_active,
    }

    setSaving(true)
    setError(null)
    try {
      if (form.id === null) await createAdminBrand(input)
      else await updateAdminBrand(form.id, input)
      setForm(EMPTY_FORM)
      brands.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ذخیره‌ی برند انجام نشد.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number, name: string) {
    if (!window.confirm(`برند «${name}» حذف شود؟`)) return

    setBusyId(id)
    setError(null)
    try {
      await deleteAdminBrand(id)
      brands.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'حذف برند انجام نشد.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-3">
      <AdminPanel title={form.id === null ? 'افزودن برند' : `ویرایش برند #${form.id}`}>
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-neutral-500">
            نام
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-white outline-none focus:border-white/25"
            />
          </label>
          <label className="flex flex-col gap-1 text-neutral-500">
            نشانی (خالی = خودکار)
            <input
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              dir="ltr"
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-white outline-none focus:border-white/25"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2 text-neutral-400">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              className="size-4 accent-cyan-400"
            />
            فعال
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.08] px-4 py-2 font-bold text-cyan-100 transition hover:border-cyan-400/40 disabled:opacity-50"
          >
            {saving ? 'در حال ذخیره…' : form.id === null ? 'افزودن' : 'ذخیره‌ی تغییرات'}
          </button>
          {form.id !== null ? (
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="rounded-xl border border-white/10 px-4 py-2 text-neutral-400 transition hover:text-white"
            >
              انصراف از ویرایش
            </button>
          ) : null}
        </div>
      </AdminPanel>

      {error ? <AdminError message={error} /> : null}

      <AdminToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        placeholder="جست‌وجوی نام برند…"
      />

      <AdminPanel
        title="برندها"
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
        {brands.loading ? (
          <AdminLoading />
        ) : brands.error ? (
          <AdminError message={brands.error} />
        ) : rows.length === 0 ? (
          <AdminEmpty message="برندی با این شرایط پیدا نشد." />
        ) : (
          <ul className="list-none space-y-2 p-0">
            {rows.map((row) => (
              <li key={row.id} className="rounded-xl border border-white/[0.08] px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-white">{row.name}</span>
                  <StatusPill
                    status={row.is_active ? 'active' : 'suspended'}
                    label={row.is_active ? 'فعال' : 'غیرفعال'}
                  />
                </div>

                <p className="mt-1 text-neutral-500">
                  <span dir="ltr" className="inline-block">/{row.slug}</span>
                  {` • ${faNum(row.products_count ?? 0)} کالا`}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ id: row.id, name: row.name, slug: row.slug, is_active: row.is_active })
                    }
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-neutral-300 transition hover:border-white/25 hover:text-white"
                  >
                    ویرایش
                  </button>
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
