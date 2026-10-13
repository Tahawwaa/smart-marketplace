import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../lib/api/client'
import { useAuth } from './auth-context'

type LocationState = { from?: string }

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setErrors({})
    try {
      await login(form)
      const state = location.state as LocationState | null
      navigate(state?.from ?? '/orders', { replace: true })
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.message)
        setErrors(cause.errors ?? {})
      } else {
        setError('ورود انجام نشد.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-sm px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-base font-extrabold text-white">ورود به حساب</h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-xs text-neutral-400">
            ایمیل
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
          />
          {errors.email ? <p className="mt-1 text-[11px] text-rose-300">{errors.email[0]}</p> : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-xs text-neutral-400">
            گذرواژه
          </label>
          <input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
          />
          {errors.password ? (
            <p className="mt-1 text-[11px] text-rose-300">{errors.password[0]}</p>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          ورود
        </button>
      </form>

      <p className="mt-4 text-xs text-neutral-500">
        حساب کاربری ندارید؟{' '}
        <Link to="/register" className="text-cyan-300 hover:text-cyan-200">
          ثبت‌نام کنید
        </Link>
      </p>
    </section>
  )
}
