import { createContext, useContext } from 'react'
import type { CartItem } from '../../types/api'

export type CartState = {
  items: CartItem[]
  count: number
  total: number
  loading: boolean
  error: string | null
  add: (vendorInventoryId: number, quantity?: number) => Promise<void>
  remove: (itemId: number) => Promise<void>
  setQuantity: (itemId: number, quantity: number) => Promise<void>
  clear: () => Promise<void>
  refresh: () => Promise<void>
}

export const CartContext = createContext<CartState | null>(null)

export function useCart() {
  const context = useContext(CartContext)
  if (context === null) throw new Error('useCart باید داخل CartProvider استفاده شود.')
  return context
}
