import { Loader2, ShoppingBag } from 'lucide-react'
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
      // ثبت‌نام فروشنده یعنی «قصد فروشندگی»؛ مرحله‌ی بعد ساختن فروشگاه است.
      navigate(form.role === 'vendor' ? '/account/store' : '/account', { replace: true })
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
      'input',
  })

  return (
    <section className="container-page grid min-h-[70vh] place-items-center py-8 sm:py-12">
      <div className="card animate-fade-up w-full max-w-md p-5 shadow-[var(--shadow-lg)] sm:p-8">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand text-brand-fg shadow-[var(--shadow-md)]">
        <ShoppingBag className="size-6" />
      </span>
      <h1 className="page-title">ساخت حساب کاربری</h1>
      <p className="mb-6 mt-1 text-xs text-fg-muted">در چند ثانیه حساب بسازید و خرید را شروع کنید.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">
            نام
          </label>
          <input type="text" required {...field('name')} />
          {errors.name ? <p className="field-error">{errors.name[0]}</p> : null}
        </div>

        <div>
          <label htmlFor="email" className="label">
            ایمیل
          </label>
          <input type="email" required {...field('email')} />
          {errors.email ? <p className="field-error">{errors.email[0]}</p> : null}
        </div>

        <div>
          <label htmlFor="phone" className="label">
            شماره تماس (اختیاری)
          </label>
          <input type="tel" {...field('phone')} />
          {errors.phone ? <p className="field-error">{errors.phone[0]}</p> : null}
        </div>

        <div>
          <label htmlFor="password" className="label">
            گذرواژه
          </label>
          <input type="password" required {...field('password')} />
          {errors.password ? (
            <p className="field-error">{errors.password[0]}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password_confirmation" className="label">
            تکرار گذرواژه
          </label>
          <input type="password" required {...field('password_confirmation')} />
        </div>

        <div>
          <label htmlFor="role" className="label">
            نوع حساب
          </label>
          <select
            id="role"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value as 'customer' | 'vendor' })}
            className="input w-full"
          >
            <option value="customer">خریدار</option>
            <option value="vendor">فروشنده</option>
          </select>
          <p className="hint">
            {form.role === 'vendor'
              ? 'پس از ثبت‌نام، نام فروشگاه را وارد می‌کنید و مدیر آن را تأیید می‌کند. حساب شما همچنان خریدار هم می‌ماند.'
              : 'هر زمان خواستید می‌توانید از پنل کاربری، فروشنده هم بشوید؛ نیازی به حساب جدید نیست.'}
          </p>
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
          ثبت‌نام
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-center text-xs text-fg-muted">
        قبلاً ثبت‌نام کرده‌اید؟{' '}
        <Link to="/login" className="font-bold text-brand hover:underline">
          وارد شوید
        </Link>
      </p>
    </div>
    </section>
  )
}
