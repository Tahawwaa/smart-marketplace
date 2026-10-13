import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faPrice } from '../../lib/format'
import { useCart } from '../cart/cart-context'
import { createAddress, fetchAddresses, placeOrder } from './api'
import type { AddressInput } from '../../types/api'

const EMPTY: AddressInput = {
  province: '',
  city: '',
  address_line: '',
  recipient_name: '',
  recipient_phone: '',
}

const FIELDS: { name: keyof AddressInput; label: string; required?: boolean }[] = [
  { name: 'recipient_name', label: 'نام گیرنده', required: true },
  { name: 'recipient_phone', label: 'شماره تماس', required: true },
  { name: 'province', label: 'استان', required: true },
  { name: 'city', label: 'شهر', required: true },
  { name: 'postal_code', label: 'کد پستی' },
  { name: 'address_line', label: 'نشانی کامل', required: true },
]

export function CheckoutPage() {
  const { items, total, loading, refresh } = useCart()
  const navigate = useNavigate()
  const addresses = useAsync((signal) => fetchAddresses(signal), 'addresses')

  const [choice, setChoice] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<AddressInput>(EMPTY)
  const [save, setSave] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saved = useMemo(() => addresses.data?.data ?? [], [addresses.data])

  // تا وقتی کاربر نشانی‌ای انتخاب نکرده، نشانی پیش‌فرض (یا فرم خالی) فعال است.
  const selected: number | 'new' =
    choice ?? (saved.length === 0 ? 'new' : (saved.find((address) => address.is_default) ?? saved[0]).id)

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const response =
        selected === 'new'
          ? await placeOrder({ address: form })
          : await placeOrder({ address_id: selected })

      if (selected === 'new' && save) {
        await createAddress(form).catch(() => undefined)
      }

      await refresh()
      navigate(`/orders/${response.data.id}`)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ثبت سفارش انجام نشد.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2 px-4 py-24 text-sm text-neutral-400">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری…
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm text-neutral-400">سبد خرید خالی است.</p>
        <Link to="/products" className="mt-4 inline-block text-xs text-cyan-300 hover:text-cyan-200">
          رفتن به فهرست کالاها
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-base font-extrabold text-white">تکمیل سفارش</h1>

      <ul className="list-none space-y-2 p-0 text-xs text-neutral-300">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between border-b border-white/[0.06] py-2">
            <span>
              {item.product?.name ?? 'کالا'} × {item.quantity}
            </span>
            <span className="tabular-nums">{faPrice(item.total_price)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-neutral-300">
        مبلغ قابل پرداخت: <span className="font-bold tabular-nums text-white">{faPrice(total)}</span>
      </p>

      <h2 className="mb-3 mt-8 text-sm font-bold text-white">نشانی تحویل</h2>

      {saved.length > 0 ? (
        <ul className="list-none space-y-2 p-0 text-xs">
          {saved.map((address) => (
            <li key={address.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] px-4 py-3">
                <input
                  type="radio"
                  name="address"
                  checked={selected === address.id}
                  onChange={() => setChoice(address.id)}
                  className="mt-1"
                />
                <span className="text-neutral-300">
                  <span className="block text-white">
                    {address.recipient_name} — {address.recipient_phone}
                  </span>
                  <span className="mt-0.5 block text-neutral-500">
                    {address.province}، {address.city}، {address.address_line}
                  </span>
                </span>
              </label>
            </li>
          ))}
          <li>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] px-4 py-3 text-neutral-300">
              <input
                type="radio"
                name="address"
                checked={selected === 'new'}
                onChange={() => setChoice('new')}
              />
              نشانی جدید
            </label>
          </li>
        </ul>
      ) : null}

      {selected === 'new' ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.name} className="text-xs text-neutral-400">
              {field.label}
              {field.required ? <span className="text-rose-300"> *</span> : null}
              <input
                value={(form[field.name] as string | undefined) ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <input type="checkbox" checked={save} onChange={(event) => setSave(event.target.checked)} />
            ذخیره‌ی این نشانی برای سفارش‌های بعدی
          </label>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-2.5 text-xs text-rose-200">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={submitting}
        onClick={() => void submit()}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        ثبت سفارش
      </button>
    </section>
  )
}
