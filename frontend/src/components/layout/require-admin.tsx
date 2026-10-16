import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/auth-context'

export function RequireAdmin() {
  const { user, ready } = useAuth()

  if (!ready) {
    return <p className="px-4 py-16 text-center text-sm text-fg-muted">در حال بارگذاری…</p>
  }

  // نقش کاربر از `/auth/me` می‌آید، پس نیازی به درخواست جداگانه نیست.
  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-fg-muted">پنل مدیریت فقط برای حساب مدیران است.</p>
        <p className="mt-2 text-xs text-fg-subtle">
          اگر فکر می‌کنید باید دسترسی داشته باشید، با مدیر سامانه هماهنگ کنید.
        </p>
        <Link to="/" className="mt-4 inline-block text-xs font-bold text-brand hover:underline">
          بازگشت به فروشگاه
        </Link>
      </div>
    )
  }

  return <Outlet />
}
