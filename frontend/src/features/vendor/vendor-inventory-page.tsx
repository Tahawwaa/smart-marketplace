import { Check, Pencil, Save, X } from 'lucide-react'
import { useState } from 'react'
import { Pager } from '../../components/ui/pager'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faNum, faPrice } from '../../lib/format'
import type { VendorStock } from '../../types/api'
import { fetchVendorStock, updateVendorStock } from './api'
import { useVendorFilters } from './use-vendor-filters'
import { VendorEmpty, VendorError, VendorLoading, VendorPageHeading, VendorSearch } from './vendor-ui'

export function VendorInventoryPage() {
  const filters = useVendorFilters()
  const filter = filters.params.get('stock') ?? ''
  const stock = useAsync((signal) => fetchVendorStock(signal, filters.page, { search: filters.search, stock: filter }), `vendor-stock-${filters.params}`)
  const [saved, setSaved] = useState(false)
  return <div className="space-y-5">
    <VendorPageHeading title="موجودی و قیمت" description="قیمت، تخفیف و زمان آماده‌سازی را به‌روز نگه دارید تا هیچ فرصتی برای فروش از دست نرود." />
    <form onSubmit={(event) => { setSaved(false); filters.apply(event) }} className="flex flex-wrap gap-2 rounded-2xl border border-line bg-surface p-3"><VendorSearch value={filters.search} placeholder="نام کالا یا کد SKU" /><select key={filter} name="stock" defaultValue={filter} aria-label="فیلتر موجودی" className="select !w-auto text-xs"><option value="">همه موجودی‌ها</option><option value="low">رو به اتمام (۱ تا ۵)</option><option value="out">ناموجود</option><option value="available">موجود و فعال</option><option value="disabled">فروش غیرفعال</option></select><button className="btn btn-secondary btn-sm">اعمال فیلتر</button>{filters.search || filter ? <button type="button" onClick={filters.reset} className="btn btn-ghost btn-sm">پاک کردن</button> : null}</form>
    {saved ? <p role="status" className="alert alert-success"><Check className="size-4" />موجودی و قیمت به‌روز شد.</p> : null}
    {stock.loading ? <VendorLoading /> : stock.error ? <VendorError message={stock.error} retry={stock.retry} /> : !stock.data?.data.length ? <VendorEmpty title="ردیف موجودی پیدا نشد" description="فیلترها را تغییر دهید یا از بخش کالاها محصول جدیدی ثبت کنید." /> : <div className="space-y-3">{stock.data.data.map((row) => <StockRow key={`${row.id}-${row.lock_version}`} row={row} onSaved={() => { setSaved(true); stock.retry() }} onRefresh={stock.retry} />)}</div>}
    {stock.data?.meta ? <Pager page={filters.page} lastPage={stock.data.meta.last_page} total={stock.data.meta.total} onChange={filters.setPage} /> : null}
  </div>
}

function StockRow({ row, onSaved, onRefresh }: { row: VendorStock; onSaved: () => void; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true); setError(null)
    try {
      await updateVendorStock(row.id, {
        price: Number(data.get('price')), sale_price: data.get('sale_price') ? Number(data.get('sale_price')) : null,
        quantity: Number(data.get('quantity')), lead_time_days: Number(data.get('lead_time_days')),
        is_available: data.get('is_available') === 'on', lock_version: row.lock_version,
      })
      setEditing(false); onSaved()
    } catch (cause) {
      setConflict(cause instanceof ApiError && cause.status === 409)
      setError(cause instanceof ApiError ? Object.values(cause.errors ?? {})[0]?.[0] ?? cause.message : 'ذخیره انجام نشد.')
    } finally { setBusy(false) }
  }
  return <article className="card p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><h3 className="text-sm font-bold text-fg">{row.variant?.product?.name ?? 'کالا'}</h3><p className="mt-1 text-[11px] text-fg-subtle">کد کالا: <bdi>{row.variant?.sku ?? '—'}</bdi>{!row.is_available ? ' · فروش غیرفعال' : ''}</p></div><div className="flex flex-wrap items-center gap-5"><div><p className="text-[10px] text-fg-subtle">قیمت فروش</p><p className="mt-1 text-xs font-bold text-fg">{faPrice(row.effective_price)}</p></div><div><p className="text-[10px] text-fg-subtle">قابل فروش / رزرو</p><p className={`mt-1 text-xs font-bold ${row.available_quantity <= 5 ? 'text-warning-ink' : 'text-fg'}`}>{faNum(row.available_quantity)} / {faNum(row.reserved_quantity)}</p></div><button type="button" disabled={busy} onClick={() => { setEditing(!editing); setError(null); setConflict(false) }} className="btn btn-secondary btn-sm">{editing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}{editing ? 'بستن' : 'ویرایش'}</button></div></div>
    {editing ? <form onSubmit={save} className="mt-5 border-t border-line pt-5"><fieldset disabled={busy || conflict} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      { name: 'price', label: 'قیمت اصلی (تومان)', value: row.price, min: 0, required: true },
      { name: 'sale_price', label: 'قیمت تخفیف (اختیاری)', value: row.sale_price ?? '', min: 0, required: false },
      { name: 'quantity', label: 'موجودی کل', value: row.quantity, min: row.reserved_quantity, required: true },
      { name: 'lead_time_days', label: 'آماده‌سازی (روز)', value: row.lead_time_days, min: 0, max: 365, required: true },
    ].map((field) => <label key={field.name} className="text-xs text-fg-muted">{field.label}<input type="number" name={field.name} defaultValue={field.value} min={field.min} max={field.max} required={field.required} step={field.name.includes('price') ? '0.01' : '1'} className="input mt-2" /></label>)}<label className="flex items-center gap-2 text-xs text-fg-muted sm:col-span-2"><input type="checkbox" name="is_available" defaultChecked={row.is_available} />فروش این تنوع فعال باشد</label></fieldset><p className="mt-3 text-[11px] text-fg-subtle">موجودی کل شامل {faNum(row.reserved_quantity)} عدد رزروشده است.</p>{error ? <p role="alert" className="alert alert-danger mt-3">{error}</p> : null}<div className="mt-4 flex gap-2"><button disabled={busy || conflict} className="btn btn-primary btn-sm"><Save className="size-4" />{busy ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</button>{conflict ? <button type="button" onClick={onRefresh} className="btn btn-secondary btn-sm">دریافت اطلاعات جدید</button> : null}</div></form> : null}
  </article>
}
