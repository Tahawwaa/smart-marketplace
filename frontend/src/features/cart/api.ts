import { api } from '../../lib/api/client'
import type { ApiItem, Cart } from '../../types/api'

export const fetchCart = (signal?: AbortSignal) => api<ApiItem<Cart>>('/cart', { signal })

export const addCartItem = (vendorInventoryId: number, quantity: number) =>
  api<ApiItem<Cart>>('/cart/items', {
    method: 'POST',
    body: { vendor_inventory_id: vendorInventoryId, quantity },
  })

export const updateCartItem = (itemId: number, quantity: number) =>
  api<ApiItem<Cart>>(`/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } })

export const removeCartItem = (itemId: number) =>
  api<ApiItem<Cart>>(`/cart/items/${itemId}`, { method: 'DELETE' })
