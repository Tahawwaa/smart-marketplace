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
  type CategoryInput,
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
} from './api'

type Form = {
  id: number | null
  name: string
  slug: string
  parent_id: string
  sort_order: string
  is_active: boolean
}

const EMPTY_FORM: Form = {
  id: null,
  name: '',
  slug: '',
  parent_id: '',
  sort_order: '0',
  is_active: true,
}

export function AdminCategoriesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const key = `${search}#${page}`
  const categories = useAsync(
    (signal) => fetchAdminCategories({ search: search || undefined, page }, signal),
    key,
  )

  const rows = categories.data?.data ?? []
  const meta = categories.data?.meta

  async function submit() {
    if (form.name.trim() === '') {
      setError('نام دسته‌بندی الزامی است.')
      return
    }

    const input: CategoryInput = {
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      parent_id: form.parent_id === '' ? null : Number(form.parent_id),
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    }

    setSaving(true)
    setError(null)
    try {
      if (form.id === null) await createAdminCategory(input)
      else await updateAdminCategory(form.id, input)
      setForm(EMPTY_FORM)
      categories.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ذخیره‌ی دسته‌بندی انجام نشد.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number, name: string) {
    if (!window.confirm(`دسته‌بندی «${name}» حذف شود؟`)) return

    setBusyId(id)
    setError(null)
    try {
      await deleteAdminCategory(id)
      categories.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'حذف دسته‌بندی انجام نشد.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-3">
      <AdminPanel title={form.id === null ? 'افزودن دسته‌بندی' : `ویرایش دسته‌بندی #${form.id}`}>
        <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-fg-subtle">
            نام
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-fg-subtle">
            نشانی (خالی = خودکار)
            <input
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              dir="ltr"
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-fg-subtle">
            دسته‌ی والد
            <select
              value={form.parent_id}
              onChange={(event) => setForm({ ...form, parent_id: event.target.value })}
              className="input"
            >
              <option value="">بدون والد</option>
              {rows
                .filter((row) => row.id !== form.id)
                .map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-fg-subtle">
            ترتیب نمایش
            <input
              value={form.sort_order}
              onChange={(event) => setForm({ ...form, sort_order: event.target.value })}
              inputMode="numeric"
              className="input tabular-nums"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2 text-fg-muted">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              className="size-4 accent-brand"
            />
            فعال
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="btn btn-secondary btn-sm"
          >
            {saving ? 'در حال ذخیره…' : form.id === null ? 'افزودن' : 'ذخیره‌ی تغییرات'}
          </button>
          {form.id !== null ? (
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="btn btn-secondary"
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
        placeholder="جست‌وجوی نام دسته‌بندی…"
      />

      <AdminPanel
        title="دسته‌بندی‌ها"
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
        {categories.loading ? (
          <AdminLoading />
        ) : categories.error ? (
          <AdminError message={categories.error} />
        ) : rows.length === 0 ? (
          <AdminEmpty message="دسته‌بندی‌ای با این شرایط پیدا نشد." />
        ) : (
          <ul className="list-none space-y-2 p-0">
            {rows.map((row) => (
              <li key={row.id} className="card px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-fg" style={{ paddingInlineStart: row.depth * 12 }}>
                    {row.name}
                  </span>
                  <StatusPill
                    status={row.is_active ? 'active' : 'suspended'}
                    label={row.is_active ? 'فعال' : 'غیرفعال'}
                  />
                </div>

                <p className="mt-1 text-fg-subtle">
                  <span dir="ltr" className="inline-block">/{row.slug}</span>
                  {` • عمق ${faNum(row.depth)}`}
                  {` • ${faNum(row.products_count ?? 0)} کالا`}
                  {row.parent_id ? ` • والد #${faNum(row.parent_id)}` : ''}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        id: row.id,
                        name: row.name,
                        slug: row.slug,
                        parent_id: row.parent_id === null ? '' : String(row.parent_id),
                        sort_order: String(row.sort_order),
                        is_active: row.is_active,
                      })
                    }
                    className="btn btn-secondary btn-sm"
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void remove(row.id, row.name)}
                    className="btn btn-danger btn-sm"
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
