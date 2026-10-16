import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../../features/home/data'

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page flex flex-col gap-10 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Link to="/" className="flex items-center gap-2.5 page-title">
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-fg shadow-[var(--shadow-md)]">
              <ShoppingBag className="size-5" />
            </span>
            بازار هوشمند
          </Link>
          <p className="mt-4 text-xs leading-7 text-fg-muted">
            برای ثبت سفارش، پیگیری مرسوله و مرجوعی کالا وارد حساب کاربری خود شوید.
          </p>
        </div>

        <nav aria-label="دسته‌بندی‌ها" className="min-w-0">
          <h2 className="mb-4 text-xs font-bold text-fg">دسته‌بندی کالاها</h2>
          <ul className="grid list-none grid-cols-2 gap-x-10 gap-y-2.5 p-0 text-xs text-fg-muted sm:grid-cols-3">
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link
                  to={`/products?category=${category.slug}`}
                  className="inline-flex items-center gap-2 transition hover:text-brand"
                >
                  <category.icon className={`size-3.5 ${category.tint}`} />
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="container-page py-5 text-[11px] text-fg-subtle">تمامی حقوق محفوظ است.</div>
      </div>
    </footer>
  )
}
