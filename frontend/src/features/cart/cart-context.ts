import { createContext, useContext } from 'react'

export type CartLine = {
  id: number
  slug: string
  name: string
  price: number
  quantity: number
}

export type CartState = {
  items: CartLine[]
  count: number
  total: number
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void
  remove: (id: number) => void
  setQuantity: (id: number, quantity: number) => void
  clear: () => void
}

export const CartContext = createContext<CartState | null>(null)

export function useCart() {
  const context = useContext(CartContext)
  if (context === null) throw new Error('useCart باید داخل CartProvider استفاده شود.')
  return context
}
