import { api } from '../../lib/api/client'
import type {
  AdminBrand,
  AdminCategory,
  AdminDashboard,
  AdminOrder,
  AdminProduct,
  AdminUser,
  AdminVendor,
  ApiItem,
  ApiList,
} from '../../types/api'

export type AdminListQuery = {
  page?: number
  per_page?: number
  search?: string
  status?: string
  role?: string
  vendor?: number
  category?: number
  payment_status?: string
}

export const fetchDashboard = (trendDays = 14, signal?: AbortSignal) =>
  api<ApiItem<AdminDashboard>>('/admin/dashboard', {
    query: { trend_days: trendDays },
    signal,
  })

export const fetchAdminVendors = (query: AdminListQuery, signal?: AbortSignal) =>
  api<ApiList<AdminVendor>>('/admin/vendors', { query, signal })

export const updateAdminVendorStatus = (id: number, status: string) =>
  api<ApiItem<AdminVendor>>(`/admin/vendors/${id}/status`, { method: 'PATCH', body: { status } })

export const updateAdminVendor = (
  id: number,
  input: { store_name?: string; commission_rate?: number; bank_sheba?: string | null },
) => api<ApiItem<AdminVendor>>(`/admin/vendors/${id}`, { method: 'PUT', body: input })

export const fetchAdminProducts = (query: AdminListQuery, signal?: AbortSignal) =>
  api<ApiList<AdminProduct>>('/admin/products', { query, signal })

export const updateAdminProductStatus = (id: number, status: string) =>
  api<ApiItem<AdminProduct>>(`/admin/products/${id}/status`, { method: 'PATCH', body: { status } })

export const updateAdminProduct = (
  id: number,
  input: { name?: string; description?: string | null; category_id?: number; brand_id?: number | null; is_active?: boolean },
) => api<ApiItem<AdminProduct>>(`/admin/products/${id}`, { method: 'PUT', body: input })

export const fetchAdminOrders = (query: AdminListQuery, signal?: AbortSignal) =>
  api<ApiList<AdminOrder>>('/admin/orders', { query, signal })

export const fetchAdminOrder = (id: number, signal?: AbortSignal) =>
  api<ApiItem<AdminOrder>>(`/admin/orders/${id}`, { signal })

export const updateAdminOrderStatus = (id: number, status: string, note?: string) =>
  api<ApiItem<AdminOrder>>(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status, note } })

export const fetchAdminUsers = (query: AdminListQuery, signal?: AbortSignal) =>
  api<ApiList<AdminUser>>('/admin/users', { query, signal })

export const updateAdminUser = (
  id: number,
  input: { name?: string; phone?: string | null; role?: string; is_active?: boolean },
) => api<ApiItem<AdminUser>>(`/admin/users/${id}`, { method: 'PUT', body: input })

export const deleteAdminUser = (id: number) => api<void>(`/admin/users/${id}`, { method: 'DELETE' })

export const fetchAdminCategories = (query: AdminListQuery, signal?: AbortSignal) =>
  api<ApiList<AdminCategory>>('/admin/categories', { query, signal })

export type CategoryInput = {
  name: string
  slug?: string | null
  parent_id?: number | null
  is_active?: boolean
  sort_order?: number
}

export const createAdminCategory = (input: CategoryInput) =>
  api<ApiItem<AdminCategory>>('/admin/categories', { method: 'POST', body: input })

export const updateAdminCategory = (id: number, input: Partial<CategoryInput>) =>
  api<ApiItem<AdminCategory>>(`/admin/categories/${id}`, { method: 'PUT', body: input })

export const deleteAdminCategory = (id: number) =>
  api<void>(`/admin/categories/${id}`, { method: 'DELETE' })

export const fetchAdminBrands = (query: AdminListQuery, signal?: AbortSignal) =>
  api<ApiList<AdminBrand>>('/admin/brands', { query, signal })

export type BrandInput = {
  name: string
  slug?: string | null
  logo_path?: string | null
  is_active?: boolean
}

export const createAdminBrand = (input: BrandInput) =>
  api<ApiItem<AdminBrand>>('/admin/brands', { method: 'POST', body: input })

export const updateAdminBrand = (id: number, input: Partial<BrandInput>) =>
  api<ApiItem<AdminBrand>>(`/admin/brands/${id}`, { method: 'PUT', body: input })

export const deleteAdminBrand = (id: number) => api<void>(`/admin/brands/${id}`, { method: 'DELETE' })

/** وضعیت فروشگاه از دید مدیر؛ «در انتظار تأیید» یعنی در صف بررسی است. */
export const ADMIN_VENDOR_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار تأیید',
  approved: 'تأیید شده',
  suspended: 'معلق',
  rejected: 'رد شده',
}

/** وضعیت کالا؛ فقط کالای «تأیید شده» در فروشگاه دیده می‌شود. */
export const ADMIN_PRODUCT_STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  pending: 'در انتظار تأیید',
  approved: 'تأیید شده',
  rejected: 'رد شده',
}

/** چرخه‌ی عمر سفارش؛ «لغو شده» و «بازگشت وجه» فقط در اختیار مدیر است. */
export const ADMIN_ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  confirmed: 'تأیید شده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
  refunded: 'بازگشت وجه',
}

export const ADMIN_ROLE_LABELS: Record<string, string> = {
  customer: 'مشتری',
  vendor: 'فروشنده',
  admin: 'مدیر',
}

/** گذرهای نهایی که هیچ‌کس جز مدیر نمی‌تواند انجام دهد. */
export const ADMIN_ORDER_TERMINAL_STATUSES = ['cancelled', 'refunded'] as const

export const adminVendorStatusLabel = (status: string) =>
  ADMIN_VENDOR_STATUS_LABELS[status] ?? status

export const adminProductStatusLabel = (status: string) =>
  ADMIN_PRODUCT_STATUS_LABELS[status] ?? status

export const adminOrderStatusLabel = (status: string) =>
  ADMIN_ORDER_STATUS_LABELS[status] ?? status

export const adminRoleLabel = (role: string) => ADMIN_ROLE_LABELS[role] ?? role
