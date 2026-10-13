import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '../../lib/api/client'
import type { Cart } from '../../types/api'
import { useAuth } from '../auth/auth-context'
import * as cartApi from './api'
import { CartContext } from './cart-context'
import { cartSession } from './cart-session'

export function CartProvider({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadedFor = useRef<number | null | undefined>(undefined)

  // سبد مهمان به شناسه‌ی مرورگر گره خورده و باید پیش از نخستین درخواست ساخته شود.
  if (typeof window !== 'undefined') cartSession.get()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await cartApi.fetchCart()
      setCart(response.data)
      setError(null)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'سبد خرید دریافت نشد.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // سبد مهمان هنگام ورود به سرور منتقل می‌شود؛ پس از تغییر کاربر دوباره می‌خوانیم.
    if (!ready || loadedFor.current === user?.id) return

    loadedFor.current = user?.id
    void refresh()
  }, [ready, user?.id, refresh])

  const mutate = useCallback(async (run: () => Promise<{ data: Cart }>) => {
    setError(null)
    try {
      const response = await run()
      setCart(response.data)
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : 'عملیات سبد خرید انجام نشد.'
      setError(message)
      throw cause
    }
  }, [])

  const add = useCallback(
    (vendorInventoryId: number, quantity = 1) =>
      mutate(() => cartApi.addCartItem(vendorInventoryId, quantity)),
    [mutate],
  )

  const remove = useCallback((itemId: number) => mutate(() => cartApi.removeCartItem(itemId)), [mutate])

  const setQuantity = useCallback(
    (itemId: number, quantity: number) =>
      quantity <= 0
        ? mutate(() => cartApi.removeCartItem(itemId))
        : mutate(() => cartApi.updateCartItem(itemId, quantity)),
    [mutate],
  )

  const clear = useCallback(async () => {
    const items = cart?.items ?? []
    for (const item of items) {
      await cartApi.removeCartItem(item.id)
    }
    await refresh()
  }, [cart, refresh])

  const value = useMemo(
    () => ({
      items: cart?.items ?? [],
      count: cart?.total_quantity ?? 0,
      total: cart?.subtotal ?? 0,
      loading,
      error,
      add,
      remove,
      setQuantity,
      clear,
      refresh,
    }),
    [cart, loading, error, add, remove, setQuantity, clear, refresh],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
