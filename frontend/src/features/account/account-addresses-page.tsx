import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { createAddress, deleteAddress, fetchAddresses, updateAddress } from '../orders/api'
import { Field, FormError, SubmitButton, inputClass } from './form-controls'
import type { Address, AddressInput } from '../../types/api'

const EMPTY: AddressInput = {
  title: '',
  province: '',
  city: '',
  postal_code: '',
  address_line: '',
  recipient_name: '',
  recipient_phone: '',
  is_default: false,
}

const FIELDS: { name: keyof AddressInput; label: string; required?: boolean }[] = [
  { name: 'recipient_name', label: 'نام گیرنده', required: true },
  { name: 'recipient_phone', label: 'شماره تماس گیرنده', required: true },
  { name: 'province', label: 'استان', required: true },
  { name: 'city', label: 'شهر', required: true },
  { name: 'postal_code', label: 'کد پستی' },
  { name: 'title', label: 'عنوان نشانی (مثلاً خانه)' },
]

export function AccountAddressesPage() {
  const addresses = useAsync((signal) => fetchAddresses(signal), 'account-addresses')
  const saved = addresses.data?.data ?? []

  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<AddressInput>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startNew() {
    setForm(EMPTY)
    setError(null)
    setEditing('new')
  }

  function startEdit(address: Address) {
    setForm({
      title: address.title ?? '',
      province: address.province,
      city: address.city,
      postal_code: address.postal_code ?? '',
      address_line: address.address_line,
      recipient_name: address.recipient_name,
      recipient_phone: address.recipient_phone,
      is_default: address.is_default,
    })
    setError(null)
    setEditing(address.id)
  }

  async function save() {
    setBusy(true)
    setError(null)
    try {
      if (editing === 'new') await createAddress(form)
      else if (editing !== null) await updateAddress(editing, form)
      setEditing(null)
      addresses.retry()
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? (Object.values(cause.errors ?? {})[0]?.[0] ?? cause.message)
          : 'ذخیره‌ی نشانی انجام نشد.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    setError(null)
    try {
      await deleteAddress(id)
      addresses.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'حذف نشانی انجام نشد.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-white">
          <MapPin className="size-4 text-cyan-300" /> نشانی‌های من
        </h2>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
        >
          <Plus className="size-4" /> نشانی جدید
        </button>
      </div>

      {editing !== null ? (
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <Field key={field.name} label={field.label} required={field.required}>
                <input
                  value={(form[field.name] as string | undefined) ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className={inputClass}
                />
              </Field>
            ))}
            <Field label="نشانی کامل" required>
              <textarea
                rows={2}
                value={form.address_line}
                onChange={(event) => setForm((current) => ({ ...current, address_line: event.target.value }))}
                className={inputClass}
              />
            </Field>
            <label className="flex items-center gap-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                checked={Boolean(form.is_default)}
                onChange={(event) => setForm((current) => ({ ...current, is_default: event.target.checked }))}
              />
              نشانی پیش‌فرض باشد
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <FormError message={error} />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <SubmitButton
              label={editing === 'new' ? 'افزودن نشانی' : 'ذخیره‌ی تغییرات'}
              busy={busy}
              onClick={() => void save()}
            />
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setError(null)
              }}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-neutral-400 transition hover:border-white/25 hover:text-white"
            >
              انصراف
            </button>
          </div>
        </section>
      ) : null}

      {!editing ? <FormError message={error} /> : null}

      {addresses.loading ? (
        <p className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="size-4 animate-spin" /> در حال بارگذاری…
        </p>
      ) : addresses.error ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] py-12 text-center text-sm text-neutral-400">
          {addresses.error}
        </div>
      ) : saved.length === 0 && editing === null ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] py-16 text-center">
          <p className="text-sm text-neutral-400">هنوز نشانی‌ای ثبت نکرده‌اید.</p>
          <p className="mt-1 text-xs text-neutral-500">برای تحویل سریع‌تر سفارش، نشانی پیش‌فرض بسازید.</p>
        </div>
      ) : (
        <ul className="list-none space-y-2 p-0">
          {saved.map((address) => (
            <li
              key={address.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
            >
              <div className="min-w-0 text-xs">
                <p className="flex items-center gap-1.5 text-white">
                  {address.recipient_name}
                  {address.is_default ? (
                    <span className="inline-flex items-center gap-0.5 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.08] px-1.5 py-0.5 text-[10px] text-emerald-200">
                      <Star className="size-3" /> پیش‌فرض
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-neutral-500" dir="ltr">
                  {address.recipient_phone}
                </p>
                <p className="mt-1 text-neutral-400">
                  {address.province}، {address.city}، {address.address_line}
                  {address.postal_code ? ` — کدپستی ${address.postal_code}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="ویرایش نشانی"
                  onClick={() => startEdit(address)}
                  className="grid size-8 place-items-center rounded-xl border border-white/10 text-neutral-300 transition hover:border-white/25 hover:text-white"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="حذف نشانی"
                  onClick={() => void remove(address.id)}
                  className="grid size-8 place-items-center rounded-xl border border-rose-400/20 text-rose-200 transition hover:border-rose-400/40"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
