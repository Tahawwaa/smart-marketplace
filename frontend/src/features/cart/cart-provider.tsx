import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CartContext, type CartLine } from './cart-context'

const STORAGE_KEY = 'sm_cart'

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as CartLine[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(readStored)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback((line: Omit<CartLine, 'quantity'>, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === line.id)
      if (existing) {
        return current.map((item) =>
          item.id === line.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...current, { ...line, quantity }]
    })
  }, [])

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const setQuantity = useCallback((id: number, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.id !== id)
        : current.map((item) => (item.id === id ? { ...item, quantity } : item)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const { count, total } = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        count: acc.count + item.quantity,
        total: acc.total + item.price * item.quantity,
      }),
      { count: 0, total: 0 },
    )
  }, [items])

  const value = useMemo(
    () => ({ items, count, total, add, remove, setQuantity, clear }),
    [items, count, total, add, remove, setQuantity, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
