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

  // حساب کاربری ممکن است فروشنده نباشد یا فروشگاهش تعلیق شده باشد؛ سرور در هر دو حالت ۴۰۳ می‌دهد.
  if (profile.error || vendor === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-neutral-300">
          {profile.error ?? 'برای این حساب فروشگاهی ثبت نشده است.'}
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          پنل فروشنده فقط برای حساب‌هایی است که فروشگاه تأییدشده دارند.
        </p>
        <Link to="/" className="mt-4 inline-block text-xs text-cyan-300 hover:text-cyan-200">
          بازگشت به فروشگاه
        </Link>
      </div>
    )
  }

  return <Outlet context={{ vendor } satisfies VendorOutletContext} />
}
