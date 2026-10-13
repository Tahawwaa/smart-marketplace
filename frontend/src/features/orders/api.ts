import { api } from '../../lib/api/client'
import type { ApiItem, ApiList, Order } from '../../types/api'
import type { CartLine } from '../cart/cart-context'

export const fetchOrders = (signal?: AbortSignal) => api<ApiList<Order>>('/orders', { signal })

export const fetchOrder = (id: number, signal?: AbortSignal) =>
  api<ApiItem<Order>>(`/orders/${id}`, { signal })

export const placeOrder = (items: CartLine[], signal?: AbortSignal) =>
  api<ApiItem<Order>>('/orders', {
    method: 'POST',
    signal,
    body: {
      items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    },
  })
