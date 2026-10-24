import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../lib/api/client'
import { createVendorProduct, updateVendorProduct, type VariantInput } from './api'
import { useCategoryOptions } from './use-category-options'
import { useVendorProduct } from './use-vendor-product'

type VariantRow = {
  id?: number
  sku: string
  price: string
  sale_price: string
  quantity: string
  lead_time_days: string
}

const EMPTY_VARIANT: VariantRow = {
  sku: '',
  price: '',
  sale_price: '',
  quantity: '',
  lead_time_days: '',
}

const EMPTY_VARIANT_ROW = { ...EMPTY_VARIANT }

function toVariantInput(row: VariantRow): VariantInput {
  return {
    sku: row.sku.trim() === '' ? null : row.sku.trim(),
    price: Number(row.price),
    sale_price: row.sale_price.trim() === '' ? null : Number(row.sale_price),
    quantity: row.quantity.trim() === '' ? null : Number(row.quantity),
    lead_time_days: row.lead_time_days.trim() === '' ? null : Number(row.lead_time_days),
  }
}

export function VendorProductFormPage() {
  const { id } = useParams()
  const productId = id === undefined ? null : Number(id)

  if (productId === null) {
    return (
      <ProductForm
        isEdit={false}
        initial={{ category_id: '', name: '', description: '', variants: [EMPTY_VARIANT_ROW] }}
      />
    )
  }

  return <EditForm key={productId} productId={productId} />
}

type FormState = {
  category_id: string
  name: string
  description: string
  variants: VariantRow[]
}

function EditForm({ productId }: { productId: number }) {
  const product = useVendorProduct(productId)

  if (product.loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری کالا…
      </p>
    )
  }

  if (product.error) {
    return <p className="text-sm text-fg-muted">{product.error}</p>
  }

  if (product.data === null) {
    return (
      <p className="text-sm text-fg-muted">
        کالا پیدا نشد.{' '}
        <Link to="/vendor/products" className="font-bold text-brand hover:underline">
          بازگشت به فهرست کالاها
        </Link>
      </p>
    )
  }

  return (
    <ProductForm
      isEdit
      productId={productId}
      initial={{
        category_id: String(product.data.category?.id ?? ''),
        name: product.data.name,
        description: product.data.description ?? '',
        variants: (product.data.variants ?? []).map((variant) => {
          const inventory = variant.inventories?.[0]
          return {
            id: variant.id,
            sku: variant.sku ?? '',
            price: inventory ? String(inventory.price) : '',
            sale_price:
              inventory?.sale_price === null || inventory?.sale_price === undefined
                ? ''
                : String(inventory.sale_price),
            // کل موجودی فرستاده می‌شود؛ موجودی قابل فروش، کل منهای رزروشده است.
            quantity: inventory ? String(inventory.quantity) : '',
            lead_time_days:
              inventory?.lead_time_days === null || inventory?.lead_time_days === undefined
                ? ''
                : String(inventory.lead_time_days),
          }
        }),
      }}
    />
  )
}

function ProductForm({
  isEdit,
  productId,
  initial,
}: {
  isEdit: boolean
  productId?: number
  initial: FormState
}) {
  const navigate = useNavigate()
  const categories = useCategoryOptions()

  const [form, setForm] = useState<FormState>(initial)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState(false)

  function patchVariant(index: number, patch: Partial<VariantRow>) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((row, position) =>
        position === index ? { ...row, ...patch } : row,
      ),
    }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors({})

    try {
      if (isEdit && productId !== undefined) {
        // سرویس بک‌اند برای هر گونه‌ی موجود، ردیف موجودی را از روی قیمت به‌روز می‌کند.
        await updateVendorProduct(productId, {
          category_id: Number(form.category_id),
          name: form.name,
          description: form.description.trim() === '' ? null : form.description,
          variants: form.variants.map((row) => ({ ...toVariantInput(row), id: row.id, sku: row.sku.trim() || undefined })),
        })
      } else {
        await createVendorProduct({
          category_id: Number(form.category_id),
          name: form.name,
          description: form.description.trim() === '' ? null : form.description,
          variants: form.variants.map(toVariantInput),
        })
      }

      navigate('/vendor/products')
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.message)
        setFieldErrors(cause.errors ?? {})
      } else {
        setError('ثبت کالا انجام نشد.')
      }
    } finally {
      setBusy(false)
    }
  }

  const messages = [...new Set(Object.values(fieldErrors).flat())]

  return (
    <form onSubmit={submit} className="space-y-4 text-xs">
      {isEdit ? null : (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-fg-muted">
          کالای جدید در وضعیت «در انتظار تأیید» ثبت می‌شود و پس از تأیید مدیر در فروشگاه نمایش داده
          می‌شود.
        </p>
      )}

      <label className="block text-fg-muted">
        نام کالا <span className="text-danger-ink">*</span>
        <input
          required
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          className="input mt-1 w-full"
        />
      </label>

      <label className="block text-fg-muted">
        دسته‌بندی <span className="text-danger-ink">*</span>
        <select
          required
          value={form.category_id}
          onChange={(event) =>
            setForm((current) => ({ ...current, category_id: event.target.value }))
          }
          className="input mt-1 w-full"
        >
          <option value="">انتخاب کنید…</option>
          {categories.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-fg-muted">
        توضیحات
        <textarea
          rows={3}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          className="input mt-1 w-full"
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-fg-muted">گونه‌ها و موجودی</span>
          {isEdit ? null : (
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  variants: [...current.variants, { ...EMPTY_VARIANT }],
                }))
              }
              className="btn btn-secondary btn-sm"
            >
              افزودن گونه
            </button>
          )}
        </div>

        {form.variants.map((row, index) => (
          <div
            key={row.id ?? `new-${index}`}
            className="grid gap-2 rounded-xl border border-line px-4 py-3 sm:grid-cols-2"
          >
            <label className="text-fg-muted">
              کد کالا (SKU)
              <input
                value={row.sku}
                onChange={(event) => patchVariant(index, { sku: event.target.value })}
                className="input mt-1 w-full"
              />
            </label>
            <label className="text-fg-muted">
              قیمت (تومان) <span className="text-danger-ink">*</span>
              <input
                required
                type="number"
                min={0}
                value={row.price}
                onChange={(event) => patchVariant(index, { price: event.target.value })}
                className="input mt-1 w-full"
              />
            </label>
            <label className="text-fg-muted">
              قیمت با تخفیف
              <input
                type="number"
                min={0}
                value={row.sale_price}
                onChange={(event) => patchVariant(index, { sale_price: event.target.value })}
                className="input mt-1 w-full"
              />
            </label>
            <label className="text-fg-muted">
              موجودی
              <input
                type="number"
                min={0}
                value={row.quantity}
                onChange={(event) => patchVariant(index, { quantity: event.target.value })}
                className="input mt-1 w-full"
              />
            </label>
            <label className="text-fg-muted">
              زمان آماده‌سازی (روز)
              <input
                type="number"
                min={0}
                value={row.lead_time_days}
                onChange={(event) => patchVariant(index, { lead_time_days: event.target.value })}
                className="input mt-1 w-full"
              />
            </label>

            {!isEdit && form.variants.length > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    variants: current.variants.filter((_, position) => position !== index),
                  }))
                }
                className="self-end btn btn-danger btn-sm sm:col-span-2"
              >
                حذف این گونه
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {error ? (
        <p className="alert alert-danger">
          {error}
        </p>
      ) : null}

      {messages.length > 0 ? (
        <ul className="list-none space-y-1 p-0 text-danger-ink">
          {messages.map((message) => (
            <li key={message}>• {message}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {isEdit ? 'ذخیره‌ی تغییرات' : 'ثبت کالا'}
        </button>
        <Link
          to="/vendor/products"
          className="btn btn-secondary"
        >
          انصراف
        </Link>
      </div>
    </form>
  )
}
