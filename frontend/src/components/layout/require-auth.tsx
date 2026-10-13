import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/auth-context'

export function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <p className="px-4 py-16 text-center text-sm text-neutral-400">در حال بارگذاری…</p>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  return <Outlet />
}
