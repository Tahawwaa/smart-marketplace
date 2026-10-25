import { ArrowLeft, Loader2, ShieldAlert, Store } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../hooks/use-async'
import { ApiError } from '../../lib/api/client'
import { adminVendorStatusLabel } from '../admin/api'
import { useAuth } from '../auth/auth-context'
import { StatusPill } from '../admin/admin-ui'
import { openStore, fetchMyStore } from './api'
import { Field, FormError, FormNotice, SubmitButton, inputClass } from './form-controls'

/**
 * «فروشندگی» — هم فرمِ فروشنده‌شدن است و هم نمای وضعیت فروشگاه.
 * وجود فروشگاه (نه نقش حساب) تعیین می‌کند کدام حالت نمایش داده شود.
 */
export function AccountStorePage() {
  const { user, setUser } = useAuth()
  const isAdmin = user?.role === 'admin'
  const store = useAsync((signal) => fetchMyStore(signal), 'account-store')

  const [storeName, setStoreName] = useState('')
  const [sheba, setSheba] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opened, setOpened] = useState(false)

  const mine = store.data?.data ?? null

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const response = await openStore({ store_name: storeName.trim(), bank_sheba: sheba.trim() || null })
      setUser(response.user)
      setOpened(true)
      store.retry()
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? (Object.values(cause.errors ?? {})[0]?.[0] ?? cause.message)
          : 'ساخت فروشگاه انجام نشد.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (store.loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <Loader2 className="size-4 animate-spin" /> در حال بارگذاری وضعیت فروشگاه…
      </p>
    )
  }

  if (store.error) {
    return <div role="alert"><FormError message={store.error} /><button type="button" onClick={store.retry} className="btn btn-secondary mt-3">تلاش دوباره</button></div>
  }

  if (mine) {
    return (
      <div className="space-y-4">
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-fg">
              <Store className="size-4 text-brand" /> فروشگاه من
            </h2>
            <StatusPill status={mine.status} label={adminVendorStatusLabel(mine.status)} />
          </div>

          <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-fg-subtle">نام فروشگاه</dt>
              <dd className="mt-0.5 text-sm text-fg">{mine.store_name}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">نشانی فروشگاه</dt>
              <dd className="mt-0.5 text-sm text-fg-muted" dir="ltr">
                /products?vendor={mine.slug}
              </dd>
            </div>
            <div>
              <dt className="text-fg-subtle">شماره شبا</dt>
              <dd className="mt-0.5 text-sm text-fg-muted" dir="ltr">
                {mine.bank_sheba ?? '—'}
              </dd>
            </div>
          </dl>

          {opened ? (
            <div className="mt-4">
              <FormNotice
                tone={mine.status === 'approved' ? 'emerald' : 'amber'}
                message={mine.status === 'approved'
                  ? 'فروشگاه شما فعال شد. می‌توانید وارد پنل فروشندگی شوید.'
                  : 'فروشگاه ثبت شد و در صف بررسی مدیر قرار گرفت.'}
              />
            </div>
          ) : null}

          {mine.status === 'pending' ? (
            <p className="alert alert-warning mt-4">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              فروشگاه شما در انتظار تأیید مدیر است. می‌توانید کالاها را آماده کنید؛ نمایش و فروش آن‌ها پس از تأیید فروشگاه و کالا انجام می‌شود.
            </p>
          ) : null}

          {mine.status === 'rejected' || mine.status === 'suspended' ? (
            <p className="alert alert-danger mt-4">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              وضعیت فروشگاه «{adminVendorStatusLabel(mine.status)}» است؛ برای پیگیری با پشتیبانی تماس بگیرید.
            </p>
          ) : null}

          <Link
            to="/vendor"
            className="btn btn-secondary btn-sm mt-4"
          >
            ورود به پنل فروشنده <ArrowLeft className="size-3.5" />
          </Link>
        </section>
      </div>
    )
  }

  return (
    <section className="max-w-xl card p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-fg">
        <Store className="size-4 text-brand" /> {isAdmin ? 'راه‌اندازی فروشگاه مدیر' : 'فروشنده شوید'}
      </h2>
      <p className="mt-1 text-[11px] text-fg-subtle">
        با ساخت فروشگاه، همان حساب فعلی شما ({user?.email}) فروشنده هم می‌شود و دسترسی خریدار یا مدیرتان از
        دست نمی‌رود.
      </p>

      <div className="mt-4 grid gap-3">
        <Field label="نام فروشگاه" required hint="این نام در فهرست کالاها و صفحه‌ی فروشگاه دیده می‌شود.">
          <input
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            placeholder="مثلاً لوازم خانگی تها"
            className={inputClass}
          />
        </Field>
        <Field label="شماره شبا" hint="اختیاری؛ برای تسویه‌ی درآمد فروش. قالب: IR و ۲۴ رقم.">
          <input
            value={sheba}
            onChange={(event) => setSheba(event.target.value)}
            placeholder="IR000000000000000000000000"
            dir="ltr"
            className={inputClass}
          />
        </Field>
      </div>

      <p className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-[11px] text-fg-muted">
        {isAdmin
          ? 'فروشگاه حساب مدیر بلافاصله پس از ثبت فعال می‌شود. پنل مدیریت و پنل فروشندگی هر دو در دسترس شما خواهند بود.'
          : 'پس از ساخت، فروشگاه در وضعیت «در انتظار تأیید» قرار می‌گیرد و مدیر آن را بررسی می‌کند.'}
      </p>

      <div className="mt-4 space-y-3">
        <FormError message={error} />
      </div>

      <div className="mt-4">
        <SubmitButton label="ساخت فروشگاه" busy={busy} onClick={() => void submit()} />
      </div>
    </section>
  )
}
