import { ShoppingBag } from 'lucide-react'
import { CATEGORIES } from '../../features/home/data'

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="flex items-center gap-2 text-sm font-bold text-neutral-200">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 text-white">
              <ShoppingBag className="size-4" />
            </span>
            بازار هوشمند
          </span>
          <p className="mt-3 max-w-sm text-xs leading-6 text-neutral-500">
            برای ثبت سفارش، پیگیری مرسوله و مرجوعی کالا وارد حساب کاربری خود شوید.
          </p>
        </div>

        <nav aria-label="دسته‌بندی‌ها" className="min-w-0">
          <h2 className="mb-3 text-xs font-bold text-neutral-400">دسته‌بندی کالاها</h2>
          <ul className="flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-xs text-neutral-500">
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <a href="#products" className="transition hover:text-neutral-200">
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-white/[0.06] pt-5 text-[11px] text-neutral-600">
        تمامی حقوق محفوظ است.
      </div>
    </footer>
  )
}
