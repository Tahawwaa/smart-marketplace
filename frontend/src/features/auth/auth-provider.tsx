import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, tokenStore } from '../../lib/api/client'
import type { User } from '../../types/api'
import * as authApi from './api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(() => !tokenStore.get())
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (ready) return

    const controller = new AbortController()
    authApi
      .fetchMe(controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return
        setUser(value)
        setReady(true)
        setError(null)
      })
      // درخواست لغوشده نشانه‌ی توکن نامعتبر نیست؛ پاک‌کردن توکن اینجا باعث خروج کاربر پس از هر رفرش می‌شد.
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
          tokenStore.clear()
          setUser(null)
          setReady(true)
        } else {
          setError('دریافت اطلاعات حساب انجام نشد. اتصال را بررسی و دوباره تلاش کنید.')
        }
      })

    return () => controller.abort()
  }, [ready, attempt])

  const login = useCallback(async (input: authApi.LoginInput) => {
    const response = await authApi.login(input)
    setUser(response.user)
    setReady(true)
    setError(null)
  }, [])

  const register = useCallback(async (input: authApi.RegisterInput) => {
    const response = await authApi.register(input)
    setUser(response.user)
    setReady(true)
    setError(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Local credentials are cleared even if the server cannot be reached.
    } finally {
      setUser(null)
      setReady(true)
      setError(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, ready, login, register, logout, setUser }),
    [user, ready, login, register, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {error && !ready ? (
        <div role="alert" className="container-page py-12 text-center">
          <p>{error}</p>
          <button type="button" className="btn btn-primary mt-4" onClick={() => { setError(null); setAttempt((value) => value + 1) }}>
            تلاش دوباره
          </button>
          <button type="button" className="btn btn-secondary mt-4 ms-2" onClick={() => void logout()}>
            خروج از حساب
          </button>
        </div>
      ) : children}
    </AuthContext.Provider>
  )
}
