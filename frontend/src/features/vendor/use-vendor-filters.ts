import { useSearchParams } from 'react-router-dom'
import type { FormEvent } from 'react'

export function useVendorFilters() {
  const [params, setParams] = useSearchParams()
  const requested = Number(params.get('page') ?? 1)
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1
  const search = params.get('search') ?? ''
  const setPage = (value: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(value))
    setParams(next)
  }
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = new URLSearchParams()
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === 'string' && value.trim()) next.set(key, value.trim())
    }
    setParams(next)
  }
  return { params, page, search, setPage, apply, reset: () => setParams({}) }
}
