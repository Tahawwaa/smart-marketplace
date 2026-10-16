import { Loader2, ShoppingBag } from 'lucide-react'
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
    <section className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="card animate-fade-up w-full max-w-md p-6 shadow-[var(--shadow-lg)] sm:p-8">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand text-brand-fg shadow-[var(--shadow-md)]">
        <ShoppingBag className="size-6" />
      </span>
      <h1 className="page-title">ورود به حساب</h1>
      <p className="mb-6 mt-1 text-xs text-fg-muted">برای ادامه خرید و پیگیری سفارش‌ها وارد شوید.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            ایمیل
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="input w-full"
          />
          {errors.email ? <p className="field-error">{errors.email[0]}</p> : null}
        </div>

        <div>
          <label htmlFor="password" className="label">
            گذرواژه
          </label>
          <input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="input w-full"
          />
          {errors.password ? (
            <p className="field-error">{errors.password[0]}</p>
          ) : null}
        </div>

        {error ? (
          <p className="alert alert-danger">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary btn-lg w-full"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          ورود
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-center text-xs text-fg-muted">
        حساب کاربری ندارید؟{' '}
        <Link to="/register" className="font-bold text-brand hover:underline">
          ثبت‌نام کنید
        </Link>
      </p>
    </div>
    </section>
  )
}
