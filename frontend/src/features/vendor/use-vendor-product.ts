import { useAsync } from '../../hooks/use-async'
import { fetchVendorProduct } from './api'

/**
 * جزئیات کالا مستقل از صفحه‌ی فعلی فهرست دریافت می‌شود.
 */
export function useVendorProduct(id: number | null) {
  const response = useAsync((signal) => id === null ? Promise.resolve(null) : fetchVendorProduct(id, signal), `vendor-product-${id}`)
  return { ...response, data: response.data?.data ?? null }
}
