import { api } from '../../lib/api/client'
import type { User, Vendor, VendorProfileResponse } from '../../types/api'

/** پروفایل فروشگاه حساب جاری؛ اگر فروشگاهی نباشد `data` تهی است. */
export const fetchMyStore = (signal?: AbortSignal) =>
  api<VendorProfileResponse>('/vendors/me', { signal })

export type OpenStoreResponse = { data: Vendor; user: User }

/**
 * «فروشنده شوید»: فروشگاه تازه می‌سازد و منتظر تأیید مدیر می‌ماند.
 * پاسخ، حساب به‌روزشده را هم برمی‌گرداند تا هدر بدون رفرش عوض شود.
 */
export const openStore = (input: { store_name: string; bank_sheba?: string | null }) =>
  api<OpenStoreResponse>('/vendors/me', { method: 'POST', body: input })
