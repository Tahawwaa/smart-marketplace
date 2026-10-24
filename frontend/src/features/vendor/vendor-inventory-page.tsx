import { Pager } from '../../components/ui/pager'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faNum, faPrice } from '../../lib/format'
import { fetchVendorStock, updateVendorStock } from './api'
import type { VendorStock } from '../../types/api'

type Draft = {
  price: string
  sale_price: string
  quantity: string
  lead_time_days: string
  is_available: boolean
}

function draftOf(row: VendorStock): Draft {
  return {
    price: String(row.price),
    sale_price: row.sale_price === null ? '' : String(row.sale_price),
    quantity: String(row.quantity),
    lead_time_days: String(row.lead_time_days),
    is_available: row.is_available,
  }
}

export function VendorInventoryPage() {
  const [page, setPage] = useState(1)
  const stock = useAsync((signal) => fetchVendorStock(signal, page), `vendor-inventory-${page}`)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rows = stock.data?.data ?? []

  function startEdit(row: VendorStock) {
    setEditing(row.id)
    setDraft(draftOf(row))
    setError(null)
  }

  async function save(id: number) {
    if (draft === null) return

    setBusy(true)
    setError(null)
    try {
      await updateVendorStock(id, {
        price: Number(draft.price),
        sale_price: draft.sale_price.trim() === '' ? null : Number(draft.sale_price),
        quantity: Number(draft.quantity),
        lead_time_days: Number(draft.lead_time_days),
        is_available: draft.is_available,
      })
      setEditing(null)
      setDraft(null)
      stock.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'به‌روزرسانی موجودی انجام نشد.')
    } finally {
      setBusy(false)
    }
  }

  if (stock.loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری…
      </p>
    )
  }

  if (stock.error) {
    return <p className="text-sm text-fg-muted">{stock.error}</p>
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-fg">موجودی و قیمت</h2>
      <p className="text-xs text-fg-subtle">
        موجودی را نمی‌توان کمتر از تعداد رزروشده ثبت کرد؛ سرور مقدار را روی همان حد نگه می‌دارد.
      </p>

      {error ? (
        <p className="alert alert-danger">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="card px-4 py-12 text-center text-xs text-fg-subtle">
          هنوز ردیف موجودی‌ای برای این فروشگاه ثبت نشده است.
        </p>
      ) : (
        <ul className="list-none space-y-2 p-0">
          {rows.map((row) => (
            <li key={row.id} className="card px-4 py-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 break-words text-start text-sm text-fg">
                  {row.variant?.product?.name ?? 'کالا'}
                </span>
                <span className="tabular-nums text-fg-subtle">
                  {row.variant?.sku ?? 'بدون کد'}
                </span>
              </div>

              {editing === row.id && draft !== null ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="text-fg-muted">
                    قیمت (تومان)
                    <input
                      type="number"
                      min={0}
                      value={draft.price}
                      onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                      className="input mt-1 w-full"
                    />
                  </label>
                  <label className="text-fg-muted">
                    قیمت با تخفیف
                    <input
                      type="number"
                      min={0}
                      value={draft.sale_price}
                      onChange={(event) => setDraft({ ...draft, sale_price: event.target.value })}
                      className="input mt-1 w-full"
                    />
                  </label>
                  <label className="text-fg-muted">
                    موجودی
                    <input
                      type="number"
                      min={0}
                      value={draft.quantity}
                      onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
                      className="input mt-1 w-full"
                    />
                  </label>
                  <label className="text-fg-muted">
                    زمان آماده‌سازی (روز)
                    <input
                      type="number"
                      min={0}
                      value={draft.lead_time_days}
                      onChange={(event) =>
                        setDraft({ ...draft, lead_time_days: event.target.value })
                      }
                      className="input mt-1 w-full"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-fg-muted">
                    <input
                      type="checkbox"
                      checked={draft.is_available}
                      onChange={(event) =>
                        setDraft({ ...draft, is_available: event.target.checked })
                      }
                    />
                    قابل فروش
                  </label>

                  <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:flex">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void save(row.id)}
                      className="btn btn-primary"
                    >
                      {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      ذخیره
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(null)
                        setDraft(null)
                      }}
                      className="btn btn-secondary"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-start text-fg-muted">
                  <span className="tabular-nums">
                    {faPrice(row.effective_price)}
                    {row.sale_price !== null ? (
                      <span className="text-fg-subtle"> (قیمت اصلی {faPrice(row.price)})</span>
                    ) : null}
                  </span>
                  <span className="tabular-nums">
                    موجودی: {faNum(row.quantity)} • رزرو: {faNum(row.reserved_quantity)}
                  </span>
                  <span>{row.is_available ? 'قابل فروش' : 'غیرفعال'}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="btn btn-secondary btn-sm"
                  >
                    ویرایش
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {stock.data?.meta ? <Pager page={page} lastPage={stock.data.meta.last_page} total={stock.data.meta.total} onChange={setPage} /> : null}
    </div>
  )
}
