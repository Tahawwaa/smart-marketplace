import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="container-page py-24 text-center">
      <div className="relative mx-auto max-w-md">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-60" />
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
          <Compass className="size-8" />
        </span>
        <p className="text-gradient mt-6 text-7xl font-extrabold tabular-nums">۴۰۴</p>
        <p className="mt-3 text-sm text-fg-muted">صفحه‌ای که دنبالش هستید پیدا نشد.</p>
        <Link to="/" className="btn btn-primary mt-6">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </section>
  )
}
