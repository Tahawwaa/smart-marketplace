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
  const { items, total, loading, error: cartError, refresh } = useCart()
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
    if (submitting || addresses.loading || addresses.error || cartError) return
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
      <p className="flex items-center justify-center gap-2 px-4 py-24 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری…
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm text-fg-muted">سبد خرید خالی است.</p>
        <Link to="/products" className="mt-4 inline-block text-xs font-bold text-brand hover:underline">
          رفتن به فهرست کالاها
        </Link>
      </section>
    )
  }

  return (
    <section className="container-page max-w-3xl py-6 sm:py-8">
      <h1 className="mb-6 page-title">تکمیل سفارش</h1>

      <ul className="list-none space-y-2 p-0 text-xs text-fg-muted">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 border-b border-line py-2">
            <span className="min-w-0 break-words">
              {item.product?.name ?? 'کالا'} × {item.quantity}
            </span>
            <span className="shrink-0 tabular-nums">{faPrice(item.total_price)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-fg-muted">
        مبلغ قابل پرداخت: <span className="font-bold tabular-nums text-fg">{faPrice(total)}</span>
      </p>

      <h2 className="mb-3 mt-8 text-sm font-bold text-fg">نشانی تحویل</h2>

      {saved.length > 0 ? (
        <ul className="list-none space-y-2 p-0 text-xs">
          {saved.map((address) => (
            <li key={address.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line px-4 py-3">
                <input
                  type="radio"
                  name="address"
                  checked={selected === address.id}
                  onChange={() => setChoice(address.id)}
                  className="mt-1"
                />
                <span className="min-w-0 break-words text-fg-muted">
                  <span className="block text-fg">
                    {address.recipient_name} — {address.recipient_phone}
                  </span>
                  <span className="mt-0.5 block text-fg-subtle">
                    {address.province}، {address.city}، {address.address_line}
                  </span>
                </span>
              </label>
            </li>
          ))}
          <li>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 text-fg-muted">
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
            <label key={field.name} className="text-xs text-fg-muted">
              {field.label}
              {field.required ? <span className="text-danger-ink"> *</span> : null}
              <input
                value={(form[field.name] as string | undefined) ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                className="input mt-1 w-full"
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            <input type="checkbox" checked={save} onChange={(event) => setSave(event.target.checked)} />
            ذخیره‌ی این نشانی برای سفارش‌های بعدی
          </label>
        </div>
      ) : null}

      {error || addresses.error || cartError ? (
        <p className="alert alert-danger mt-4">
          {error ?? addresses.error ?? cartError}
        </p>
      ) : null}

      <button
        type="button"
        disabled={submitting || addresses.loading || Boolean(addresses.error) || Boolean(cartError)}
        onClick={() => void submit()}
        className="btn btn-primary mt-6 w-full sm:w-auto"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        ثبت سفارش
      </button>
    </section>
  )
}
