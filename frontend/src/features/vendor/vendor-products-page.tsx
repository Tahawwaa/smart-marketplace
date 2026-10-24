import { Pager } from '../../components/ui/pager'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faPrice } from '../../lib/format'
import { deleteVendorProduct, fetchVendorProducts, vendorStatusLabel } from './api'

export function VendorProductsPage() {
  const [page, setPage] = useState(1)
  const products = useAsync((signal) => fetchVendorProducts(signal, page), `vendor-products-${page}`)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rows = products.data?.data ?? []

  async function remove(id: number) {
    if (!window.confirm('این کالا از فهرست فروشگاه برداشته شود؟')) return

    setBusyId(id)
    setError(null)
    try {
      await deleteVendorProduct(id)
      products.retry()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'حذف کالا انجام نشد.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-fg">کالاهای فروشگاه</h2>
        <Link
          to="/vendor/products/new"
          className="btn btn-primary btn-sm"
        >
          افزودن کالا
        </Link>
      </div>

      {error ? (
        <p className="alert alert-danger">
          {error}
        </p>
      ) : null}

      {products.loading ? (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Loader2 className="size-4 animate-spin" />
          در حال بارگذاری…
        </p>
      ) : products.error ? (
        <p className="text-sm text-fg-muted">{products.error}</p>
      ) : rows.length === 0 ? (
        <p className="card px-4 py-12 text-center text-xs text-fg-subtle">
          هنوز کالایی برای این فروشگاه ثبت نشده است.
        </p>
      ) : (
        <ul className="list-none space-y-2 p-0">
          {rows.map((product) => (
            <li
              key={product.id}
              className="card px-4 py-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 break-words text-start text-sm text-fg">{product.name}</span>
                <span className="badge badge-neutral">
                  {vendorStatusLabel(product.status)}
                </span>
              </div>

              <p className="mt-1 text-start text-fg-subtle">
                {product.category?.name ?? 'بدون دسته‌بندی'}
                {product.brand ? ` • ${product.brand.name}` : ''}
              </p>

              <ul className="mt-2 list-none space-y-1 p-0 text-start text-fg-muted">
                {(product.variants ?? []).map((variant) => {
                  const inventory = variant.inventories?.[0]
                  return (
                    <li key={variant.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="tabular-nums">{variant.sku ?? 'بدون کد'}</span>
                      <span className="tabular-nums">
                        {faPrice(inventory?.effective_price ?? 0)} • موجودی:{' '}
                        {inventory?.available_quantity ?? 0}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/vendor/products/${product.id}/edit`}
                  className="btn btn-secondary btn-sm"
                >
                  ویرایش
                </Link>
                <button
                  type="button"
                  disabled={busyId === product.id}
                  onClick={() => void remove(product.id)}
                  className="btn btn-danger btn-sm"
                >
                  {busyId === product.id ? 'در حال حذف…' : 'حذف'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {products.data?.meta ? <Pager page={page} lastPage={products.data.meta.last_page} total={products.data.meta.total} onChange={setPage} /> : null}
    </div>
  )
}
