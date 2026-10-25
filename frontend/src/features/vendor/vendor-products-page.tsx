import { Archive, Package, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pager } from '../../components/ui/pager'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faNum, faPrice } from '../../lib/format'
import { deleteVendorProduct, fetchVendorProducts, vendorStatusLabel } from './api'
import { useVendorFilters } from './use-vendor-filters'
import { VendorEmpty, VendorError, VendorLoading, VendorPageHeading, VendorSearch, VendorStatus } from './vendor-ui'

export function VendorProductsPage() {
  const filters = useVendorFilters()
  const status = filters.params.get('status') ?? ''
  const products = useAsync((signal) => fetchVendorProducts(signal, filters.page, { search: filters.search, status }), `vendor-products-${filters.params}`)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rows = products.data?.data ?? []
  async function remove(id: number) {
    if (!window.confirm('این کالا بایگانی و از ویترین فروشگاه برداشته شود؟ سوابق سفارش‌ها حفظ می‌شود.')) return
    setBusyId(id); setError(null)
    try { await deleteVendorProduct(id); if (rows.length === 1 && filters.page > 1) filters.setPage(filters.page - 1); else products.retry() }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'بایگانی کالا انجام نشد.') }
    finally { setBusyId(null) }
  }
  return <div className="space-y-5">
    <VendorPageHeading title="کالاهای من" description="اطلاعات، وضعیت انتشار و موجودی کالاهای فروشگاه را یکجا ببینید." action={<Link to="/vendor/products/new" className="btn btn-primary btn-sm"><Plus className="size-4" />افزودن کالا</Link>} />
    <form onSubmit={filters.apply} className="flex flex-wrap gap-2 rounded-2xl border border-line bg-surface p-3"><VendorSearch value={filters.search} placeholder="جست‌وجوی نام کالا یا کد SKU" /><select key={status} name="status" defaultValue={status} aria-label="وضعیت انتشار" className="select !w-auto text-xs"><option value="">همه وضعیت‌ها</option>{['pending', 'approved', 'rejected', 'draft'].map((value) => <option key={value} value={value}>{vendorStatusLabel(value)}</option>)}</select><button className="btn btn-secondary btn-sm">اعمال فیلتر</button>{filters.search || status ? <button type="button" onClick={filters.reset} className="btn btn-ghost btn-sm">پاک کردن</button> : null}</form>
    {error ? <p role="alert" className="alert alert-danger">{error}</p> : null}
    {products.loading ? <VendorLoading /> : products.error ? <VendorError message={products.error} retry={products.retry} /> : !rows.length ? <VendorEmpty title="کالایی پیدا نشد" description="فیلترها را تغییر دهید یا اولین کالای فروشگاه را ثبت کنید." action={<Link to="/vendor/products/new" className="btn btn-primary btn-sm">ثبت کالا</Link>} /> : <div className="grid gap-3 xl:grid-cols-2">{rows.map((product) => {
      const inventory = (product.variants ?? []).flatMap((variant) => variant.inventories ?? [])
      const price = inventory.length ? Math.min(...inventory.map((row) => row.effective_price)) : null
      return <article key={product.id} className="card flex flex-col p-5"><div className="flex items-start gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-brand"><Package className="size-5" /></span><div className="min-w-0 flex-1"><Link to={`/vendor/products/${product.id}/edit`} className="line-clamp-2 text-sm font-bold leading-6 text-fg hover:text-brand">{product.name}</Link><p className="mt-1 text-[11px] text-fg-subtle">{product.category?.name ?? 'بدون دسته‌بندی'}{product.brand ? ` · ${product.brand.name}` : ''}</p></div><VendorStatus status={product.status} /></div><dl className="my-5 grid grid-cols-3 divide-x divide-x-reverse divide-line rounded-xl bg-surface-2 p-3 text-xs"><div className="px-2"><dt className="text-[10px] text-fg-subtle">قیمت از</dt><dd className="mt-2 font-bold text-fg">{faPrice(price) ?? '—'}</dd></div><div className="px-2"><dt className="text-[10px] text-fg-subtle">قابل فروش</dt><dd className="mt-2 font-bold text-fg">{faNum(inventory.reduce((sum, row) => sum + row.available_quantity, 0))} عدد</dd></div><div className="px-2"><dt className="text-[10px] text-fg-subtle">تنوع</dt><dd className="mt-2 font-bold text-fg">{faNum(product.variants?.length ?? 0)}</dd></div></dl><div className="mt-auto flex flex-wrap items-center gap-2"><Link to={`/vendor/products/${product.id}/edit`} className="btn btn-secondary btn-sm"><Pencil className="size-3.5" />ویرایش کالا</Link><span className="ms-auto text-[10px] text-fg-subtle">{product.is_active ? 'نمایش فعال' : 'نمایش غیرفعال'}</span><button type="button" disabled={busyId !== null} onClick={() => void remove(product.id)} aria-label={`بایگانی ${product.name}`} className="btn btn-ghost btn-sm text-danger-ink"><Archive className="size-4" />{busyId === product.id ? 'در حال بایگانی…' : 'بایگانی'}</button></div></article>
    })}</div>}
    {products.data?.meta ? <Pager page={filters.page} lastPage={products.data.meta.last_page} total={products.data.meta.total} onChange={filters.setPage} /> : null}
  </div>
}
