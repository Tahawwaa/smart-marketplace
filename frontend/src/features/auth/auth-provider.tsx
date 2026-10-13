import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { tokenStore } from '../../lib/api/client'
import type { User } from '../../types/api'
import * as authApi from './api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!tokenStore.get())

  useEffect(() => {
    if (ready) return

    const controller = new AbortController()
    authApi
      .fetchMe(controller.signal)
      .then(setUser)
      // درخواست لغوشده نشانه‌ی توکن نامعتبر نیست؛ پاک‌کردن توکن اینجا باعث خروج کاربر پس از هر رفرش می‌شد.
      .catch(() => {
        if (!controller.signal.aborted) tokenStore.clear()
      })
      .finally(() => {
        if (!controller.signal.aborted) setReady(true)
      })

    return () => controller.abort()
  }, [ready])

  const login = useCallback(async (input: authApi.LoginInput) => {
    const response = await authApi.login(input)
    setUser(response.user)
  }, [])

  const register = useCallback(async (input: authApi.RegisterInput) => {
    const response = await authApi.register(input)
    setUser(response.user)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
