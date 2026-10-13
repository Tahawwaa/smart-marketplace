import { api } from '../../lib/api/client'
import type { Address, AddressInput, ApiItem, ApiList, Order } from '../../types/api'

export const fetchOrders = (signal?: AbortSignal) => api<ApiList<Order>>('/orders', { signal })

export const fetchOrder = (id: number, signal?: AbortSignal) =>
  api<ApiItem<Order>>(`/orders/${id}`, { signal })

/** سفارش از روی سبد سمت سرور ساخته می‌شود؛ فقط نشانی فرستاده می‌شود. */
export const placeOrder = (address: { address_id: number } | { address: AddressInput }) =>
  api<ApiItem<Order>>('/orders', { method: 'POST', body: address })

export const fetchAddresses = (signal?: AbortSignal) => api<ApiList<Address>>('/addresses', { signal })

export const createAddress = (input: AddressInput) =>
  api<ApiItem<Address>>('/addresses', { method: 'POST', body: input })
