import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/auth-context'

export function RequireAdmin() {
  const { user, ready } = useAuth()

  if (!ready) {
    return <p className="px-4 py-16 text-center text-sm text-neutral-400">در حال بارگذاری…</p>
  }

  // نقش کاربر از `/auth/me` می‌آید، پس نیازی به درخواست جداگانه نیست.
  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-neutral-300">پنل مدیریت فقط برای حساب مدیران است.</p>
        <p className="mt-2 text-xs text-neutral-500">
          اگر فکر می‌کنید باید دسترسی داشته باشید، با مدیر سامانه هماهنگ کنید.
        </p>
        <Link to="/" className="mt-4 inline-block text-xs text-cyan-300 hover:text-cyan-200">
          بازگشت به فروشگاه
        </Link>
      </div>
    )
  }

  return <Outlet />
}
