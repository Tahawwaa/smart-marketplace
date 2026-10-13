import { Loader2 } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { useAsync } from '../../hooks/use-async'
import { fetchVendorProfile } from '../../features/vendor/api'
import type { Vendor } from '../../types/api'

/** پروفایل فروشگاه در دسترس همه‌ی صفحه‌های پنل قرار می‌گیرد. */
export type VendorOutletContext = { vendor: Vendor }

export function RequireVendor() {
  const profile = useAsync((signal) => fetchVendorProfile(signal), 'vendor-profile')

  if (profile.loading) {
    return (
      <p className="flex items-center justify-center gap-2 px-4 py-24 text-sm text-neutral-400">
        <Loader2 className="size-4 animate-spin" />
        در حال بارگذاری پنل فروشنده…
      </p>
    )
  }

  const vendor = profile.data?.data ?? null

  // فروشگاهی ثبت نشده: کاربر می‌تواند از همین‌جا فروشنده شود.
  if (vendor === null && profile.error === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-neutral-200">هنوز فروشگاهی برای این حساب ثبت نشده است.</p>
        <p className="mt-2 text-xs text-neutral-500">
          با ساخت فروشگاه، همان حساب فعلی فروشنده هم می‌شود و دسترسی خریدار یا مدیرتان از دست نمی‌رود. فروشگاه پس
          از تأیید مدیر فعال می‌شود.
        </p>
        <Link
          to="/account/store"
          className="mt-5 inline-block rounded-xl border border-cyan-400/25 bg-cyan-400/[0.08] px-4 py-2.5 text-xs font-bold text-cyan-100 transition hover:border-cyan-400/40"
        >
          فروشنده شوید
        </Link>
        <Link to="/" className="ms-3 mt-5 inline-block text-xs text-neutral-400 hover:text-white">
          بازگشت به فروشگاه
        </Link>
      </div>
    )
  }

  // فروشگاه هست ولی سرور آن را نپذیرفته (تعلیق یا رد شده)؛ ساخت دوباره بی‌فایده است.
  if (profile.error || vendor === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-neutral-300">
          {profile.error ?? 'برای این حساب فروشگاهی ثبت نشده است.'}
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          برای پیگیری وضعیت فروشگاه به بخش «فروشندگی» در پنل کاربری سر بزنید.
        </p>
        <Link to="/account/store" className="mt-4 inline-block text-xs text-cyan-300 hover:text-cyan-200">
          وضعیت فروشگاه من
        </Link>
      </div>
    )
  }

  return <Outlet context={{ vendor } satisfies VendorOutletContext} />
}
