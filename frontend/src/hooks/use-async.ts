import { useEffect, useState } from 'react'
import { ApiError } from '../lib/api/client'

type Result<T> = { key: string; data: T | null; error: string | null }

export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, key = '') {
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${key}#${attempt}`
  const [result, setResult] = useState<Result<T> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
      .then((data) => setResult({ key: requestKey, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof ApiError ? error.message : 'خطای غیرمنتظره.'
        setResult({ key: requestKey, data: null, error: message })
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const current = result?.key === requestKey ? result : null
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    retry: () => setAttempt((value) => value + 1),
  }
}
