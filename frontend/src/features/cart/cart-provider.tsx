import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from '../../lib/api/client'
import { createRequestQueue } from '../../lib/request-queue'
import type { Cart } from '../../types/api'
import { useAuth } from '../auth/auth-context'
import * as cartApi from './api'
import { CartContext } from './cart-context'
import { cartSession } from './cart-session'

export function CartProvider({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth()
  return <CartSessionProvider key={ready ? (user?.id ?? 'guest') : 'pending'} ready={ready}>{children}</CartSessionProvider>
}

function CartSessionProvider({ children, ready }: { children: ReactNode; ready: boolean }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [queue] = useState(createRequestQueue)

  const loadCart = useCallback(() =>
    queue.run(async () => {
      cartSession.get()
      return cartApi.fetchCart()
    }).then((response) => {
      setCart(response.data)
      setError(null)
    }).catch((cause: unknown) => {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setError(cause instanceof ApiError ? cause.message : 'سبد خرید دریافت نشد.')
    }).finally(() => {
      setLoading(false)
    }), [queue])

  const refresh = useCallback(async () => {
    setLoading(true)
    await loadCart()
  }, [loadCart])

  useEffect(() => {
    if (ready) void loadCart()
    return () => queue.invalidate()
  }, [ready, loadCart, queue])

  const mutate = useCallback(async (run: () => Promise<{ data: Cart }>) => {
    setError(null)
    try {
      cartSession.get()
      const response = await queue.run(run)
      setCart(response.data)
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
      const message = cause instanceof ApiError ? cause.message : 'عملیات سبد خرید انجام نشد.'
      setError(message)
      throw cause
    }
  }, [queue])

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
      await remove(item.id)
    }
    await refresh()
  }, [cart, refresh, remove])

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
