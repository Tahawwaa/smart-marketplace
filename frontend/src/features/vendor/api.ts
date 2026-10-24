import { api, BASE_URL, tokenStore } from '../../lib/api/client'
import type {
  ApiItem,
  ApiList,
  VendorProduct,
  VendorProfileResponse,
  VendorStock,
  VendorSubOrder,
} from '../../types/api'

export const fetchVendorProfile = (signal?: AbortSignal) =>
  api<VendorProfileResponse>('/vendors/me', { signal })

export type VendorAnalytics = {
  catalog: { products: number; pending_products: number; out_of_stock: number }
  period_days: number
  totals: { orders: number; revenue: number; commission: number; net: number; average_order_value: number }
  payouts: { pending: number; paid: number }
  daily: { date: string; orders: number; revenue: number }[]
  status_counts: Record<string, number>
  top_products: { name: string; units: number; revenue: number }[]
  low_stock: { id: number; name: string | null; sku: string | null; available_quantity: number }[]
}

export const fetchVendorAnalytics = (days: number, signal?: AbortSignal) =>
  api<{ data: VendorAnalytics }>('/vendors/me/analytics', { query: { days }, signal })

export async function downloadVendorOrdersCsv() {
  const token = tokenStore.get()
  const response = await fetch(`${BASE_URL}/vendors/me/orders-export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error('دریافت فایل ناموفق بود.')
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = 'vendor-orders.csv'
  link.click()
  URL.revokeObjectURL(url)
}

/** ورودی یک گونه همراه با موجودی اولیه‌ی آن. */
export type VariantInput = {
  id?: number
  sku?: string | null
  barcode?: string | null
  weight_grams?: number | null
  price: number
  sale_price?: number | null
  quantity?: number | null
  lead_time_days?: number | null
  is_available?: boolean
}

export type ProductInput = {
  category_id: number
  brand_id?: number | null
  name: string
  description?: string | null
  is_active?: boolean
  meta_title?: string | null
  meta_description?: string | null
  variants: VariantInput[]
}

/** کالای تازه‌ی فروشنده همیشه در وضعیت «در انتظار تأیید» ثبت می‌شود. */
export const createVendorProduct = (input: ProductInput) =>
  api<ApiItem<VendorProduct>>('/vendors/me/products', { method: 'POST', body: input })

export const fetchVendorProducts = (signal?: AbortSignal, page = 1) =>
  api<ApiList<VendorProduct>>('/vendors/me/products', { signal, query: { page } })

export const fetchVendorProduct = (id: number, signal?: AbortSignal) =>
  api<ApiItem<VendorProduct>>(`/vendors/me/products/${id}`, { signal })

export const updateVendorProduct = (id: number, input: Partial<ProductInput>) =>
  api<ApiItem<VendorProduct>>(`/vendors/me/products/${id}`, { method: 'PUT', body: input })

export const deleteVendorProduct = (id: number) =>
  api<void>(`/vendors/me/products/${id}`, { method: 'DELETE' })

export const fetchVendorStock = (signal?: AbortSignal, page = 1) =>
  api<ApiList<VendorStock>>('/vendors/me/inventory', { signal, query: { page } })

export type StockInput = {
  price?: number
  sale_price?: number | null
  quantity?: number
  is_available?: boolean
  lead_time_days?: number
}

export const updateVendorStock = (id: number, input: StockInput) =>
  api<ApiItem<VendorStock>>(`/vendors/me/inventory/${id}`, { method: 'PUT', body: input })

export const fetchVendorOrders = (status: string, signal?: AbortSignal, page = 1) =>
  api<ApiList<VendorSubOrder>>('/vendors/me/orders', {
    query: { status: status || undefined, page },
    signal,
  })

/** فقط گذرهای مجاز فروشنده؛ لغو و بازگشت وجه در اختیار فروشنده نیست. */
export const VENDOR_SUB_ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'] as const

export const updateVendorSubOrderStatus = (id: number, status: string, note?: string) =>
  api<ApiItem<VendorSubOrder>>(`/vendors/me/orders/${id}/status`, {
    method: 'PATCH',
    body: { status, note },
  })

/** وضعیت فروشگاه و کالا؛ «در انتظار تأیید» یعنی منتظر بررسی مدیر. */
export const VENDOR_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار تأیید',
  active: 'فعال',
  suspended: 'معلق',
  rejected: 'رد شده',
  draft: 'پیش‌نویس',
  approved: 'تأیید شده',
}

/** وضعیت زیرسفارش؛ «pending» اینجا یعنی منتظر پرداخت مشتری. */
export const SUB_ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  confirmed: 'تأیید شده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
  refunded: 'بازگشت وجه',
}

export const vendorStatusLabel = (status: string) => VENDOR_STATUS_LABELS[status] ?? status

export const subOrderStatusLabel = (status: string) => SUB_ORDER_STATUS_LABELS[status] ?? status
