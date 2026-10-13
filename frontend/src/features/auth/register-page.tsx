import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../lib/api/client'
import { useAuth } from './auth-context'

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  role: 'customer' as 'customer' | 'vendor',
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setErrors({})
    try {
      await register({ ...form, phone: form.phone || undefined })
      navigate('/orders', { replace: true })
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.message)
        setErrors(cause.errors ?? {})
      } else {
        setError('ثبت‌نام انجام نشد.')
      }
    } finally {
      setBusy(false)
    }
  }

  const field = (name: keyof typeof EMPTY) => ({
    id: name,
    value: form[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [name]: event.target.value }),
    className:
      'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none',
  })

  return (
    <section className="mx-auto max-w-sm px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-base font-extrabold text-white">ساخت حساب کاربری</h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-xs text-neutral-400">
            نام
          </label>
          <input type="text" required {...field('name')} />
          {errors.name ? <p className="mt-1 text-[11px] text-rose-300">{errors.name[0]}</p> : null}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-xs text-neutral-400">
            ایمیل
          </label>
          <input type="email" required {...field('email')} />
          {errors.email ? <p className="mt-1 text-[11px] text-rose-300">{errors.email[0]}</p> : null}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-xs text-neutral-400">
            شماره تماس (اختیاری)
          </label>
          <input type="tel" {...field('phone')} />
          {errors.phone ? <p className="mt-1 text-[11px] text-rose-300">{errors.phone[0]}</p> : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-xs text-neutral-400">
            گذرواژه
          </label>
          <input type="password" required {...field('password')} />
          {errors.password ? (
            <p className="mt-1 text-[11px] text-rose-300">{errors.password[0]}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password_confirmation" className="mb-1 block text-xs text-neutral-400">
            تکرار گذرواژه
          </label>
          <input type="password" required {...field('password_confirmation')} />
        </div>

        <div>
          <label htmlFor="role" className="mb-1 block text-xs text-neutral-400">
            نوع حساب
          </label>
          <select
            id="role"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value as 'customer' | 'vendor' })}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="customer">خریدار</option>
            <option value="vendor">فروشنده</option>
          </select>
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
          ثبت‌نام
        </button>
      </form>

      <p className="mt-4 text-xs text-neutral-500">
        قبلاً ثبت‌نام کرده‌اید؟{' '}
        <Link to="/login" className="text-cyan-300 hover:text-cyan-200">
          وارد شوید
        </Link>
      </p>
    </section>
  )
}
