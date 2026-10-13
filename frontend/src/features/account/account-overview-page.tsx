import { ArrowLeft, IdCard, Mail, ShieldCheck, ShoppingBag, Sparkles, Store, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { faNum } from '../../lib/format'
import { adminRoleLabel, adminVendorStatusLabel } from '../admin/api'
import { updateProfile } from '../auth/api'
import { useAuth } from '../auth/auth-context'
import { fetchOrders } from '../orders/api'
import { Field, FormError, FormNotice, SubmitButton, inputClass } from './form-controls'

export function AccountOverviewPage() {
  const { user, setUser } = useAuth()
  const orders = useAsync((signal) => fetchOrders(signal), 'account-overview-orders')

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (!user) return null

  const orderCount = orders.data?.meta?.total ?? orders.data?.data.length ?? 0

  async function submit() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const response = await updateProfile({ name: name.trim(), phone: phone.trim() || null })
      setUser(response.data)
      setSaved(true)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? (Object.values(cause.errors ?? {})[0]?.[0] ?? cause.message)
          : 'ذخیره‌ی مشخصات انجام نشد.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <UserRound className="size-3.5" /> سطح دسترسی حساب
          </p>
          <p className="mt-2 text-sm font-bold text-white">{adminRoleLabel(user.role ?? 'customer')}</p>
          {user.store ? (
            <p className="mt-1 text-[11px] text-cyan-200">
              فروشگاه: {user.store.store_name} ({adminVendorStatusLabel(user.store.status)})
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-neutral-500">هنوز فروشگاهی باز نکرده‌اید.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <ShoppingBag className="size-3.5" /> سفارش‌های من
          </p>
          <p className="mt-2 text-lg font-extrabold tabular-nums text-white">
            {orders.loading ? '…' : faNum(orderCount)}
          </p>
          <Link
            to="/account/orders"
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200"
          >
            مشاهده‌ی سفارش‌ها <ArrowLeft className="size-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Store className="size-3.5" /> فروشندگی
          </p>
          <p className="mt-2 text-sm font-bold text-white">
            {user.store ? 'فروشنده هستید' : 'فروشنده نیستید'}
          </p>
          <Link
            to={user.store ? '/vendor' : '/account/store'}
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200"
          >
            {user.store ? 'ورود به پنل فروشنده' : 'فروشنده شوید'} <ArrowLeft className="size-3" />
          </Link>
        </div>
      </div>

      {user.role === 'admin' ? (
        <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.06] px-4 py-3 text-xs text-violet-100">
          <p className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="size-4" /> این حساب مدیر است
          </p>
          <p className="mt-1 text-violet-200/80">
            نقش مدیر با باز کردن فروشگاه تغییر نمی‌کند؛ می‌توانید هم‌زمان مدیر، فروشنده و خریدار باشید.
          </p>
          <Link to="/admin" className="mt-2 inline-flex items-center gap-1 text-violet-100 hover:text-white">
            رفتن به پنل مدیریت <ArrowLeft className="size-3" />
          </Link>
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-white">
          <Sparkles className="size-4 text-cyan-300" /> مشخصات من
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="نام و نام خانوادگی" required>
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </Field>
          <Field label="شماره تماس" hint="اختیاری؛ برای هماهنگی ارسال سفارش">
            <input
              value={phone ?? ''}
              onChange={(event) => setPhone(event.target.value)}
              dir="ltr"
              className={inputClass}
            />
          </Field>
          <div className="text-xs text-neutral-400">
            ایمیل
            <p className="mt-1 flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-neutral-400">
              <Mail className="size-3.5" />
              <span dir="ltr">{user.email}</span>
            </p>
            <span className="mt-1 block text-[11px] text-neutral-500">ایمیل حساب قابل تغییر نیست.</span>
          </div>
          <div className="text-xs text-neutral-400">
            نقش حساب
            <p className="mt-1 flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-neutral-400">
              <IdCard className="size-3.5" />
              {adminRoleLabel(user.role ?? 'customer')}
            </p>
            <span className="mt-1 block text-[11px] text-neutral-500">
              نقش را فقط مدیر سامانه تغییر می‌دهد.
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {saved ? <FormNotice message="مشخصات با موفقیت ذخیره شد." /> : null}
          <FormError message={error} />
        </div>

        <div className="mt-4">
          <SubmitButton label="ذخیره‌ی مشخصات" busy={saving} onClick={() => void submit()} />
        </div>
      </section>
    </div>
  )
}
