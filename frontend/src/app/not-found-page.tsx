import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <p className="text-3xl font-extrabold text-white">۴۰۴</p>
      <p className="mt-3 text-sm text-neutral-400">صفحه‌ای که دنبالش هستید پیدا نشد.</p>
      <Link to="/" className="mt-5 inline-block text-xs text-cyan-300 hover:text-cyan-200">
        بازگشت به صفحه اصلی
      </Link>
    </section>
  )
}
