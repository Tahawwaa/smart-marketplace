import { LayoutDashboard, LogOut, Menu, Search, ShoppingBag, Store, User, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/auth-context'
import { useCart } from '../../features/cart/cart-context'
import { CATEGORIES } from '../../features/home/data'
import { cn } from '../../lib/cn'
import { ThemeToggle } from './theme-toggle'
import { faNum } from '../../lib/format'

const ALL_ITEMS_LABEL = 'همه کالاها'

export function SiteHeader() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, logout } = useAuth()
  const { count } = useCart()

  const category = params.get('category') ?? ''
  const search = params.get('search') ?? ''
  const [input, setInput] = useState(search)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Dismiss the category panel on an outside click, a tap away, or Esc.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Keep the field in sync when the term is changed from outside (e.g. cleared elsewhere).
  const [seenSearch, setSeenSearch] = useState(search)
  if (seenSearch !== search) {
    setSeenSearch(search)
    setInput(search)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const term = input.trim()
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : '/products')
  }

  function selectCategory(slug: string) {
    setOpen(false)
    navigate(slug ? `/products?category=${slug}` : '/products')
  }

  return (
    <header
      ref={panelRef}
      className="sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur-xl"
    >
      <div className="container-page flex items-center gap-2 py-3 sm:gap-3">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-sm font-extrabold text-fg">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-fg shadow-[var(--shadow-md)]">
            <ShoppingBag className="size-5" />
          </span>
          <span className="hidden sm:inline">بازار هوشمند</span>
        </Link>

        <form
          onSubmit={submit}
          role="search"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 transition focus-within:border-brand focus-within:bg-surface focus-within:shadow-[0_0_0_4px_var(--ring)]"
        >
          <Search className="size-4 shrink-0 text-fg-subtle" />
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="جست‌وجوی نام کالا یا برند…"
            aria-label="جست‌وجوی کالا"
            className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
          />
          {input && (
            <button
              type="button"
              aria-label="پاک‌کردن جست‌وجو"
              onClick={() => {
                setInput('')
                navigate('/products')
              }}
              className="grid size-6 shrink-0 place-items-center rounded-full text-fg-subtle transition hover:bg-surface-3 hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>

        <Link
          to="/cart"
          aria-label="سبد خرید"
          className="relative grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-fg-muted transition hover:border-line-strong hover:text-fg"
        >
          <ShoppingBag className="size-4" />
          {count > 0 ? (
            <span className="absolute -end-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white tabular-nums">
              {faNum(count)}
            </span>
          ) : null}
        </Link>

        {user ? (
          <div className="flex shrink-0 items-center gap-1.5">
            {/* پنل مدیریت همیشه دیده می‌شود؛ داشتن فروشگاه نقشی را از مدیر نمی‌گیرد. */}
            {user.role === 'admin' ? (
              <Link
                to="/admin"
                title="پنل مدیریت"
                className="alert alert-info"
              >
                <LayoutDashboard className="size-4 sm:hidden" />
                <span className="hidden sm:inline">پنل مدیریت</span>
              </Link>
            ) : null}

            {/* فروشندگی با «وجود فروشگاه» تعیین می‌شود، نه با نقش حساب. */}
            {user.store ? (
              <Link
                to="/vendor"
                title="پنل فروشنده"
                className="alert alert-info"
              >
                <Store className="size-4 sm:hidden" />
                <span className="hidden sm:inline">پنل فروشنده</span>
              </Link>
            ) : (
              <Link
                to="/account/store"
                title="فروشنده شوید"
                className="flex items-center gap-1.5 rounded-xl border border-line px-2.5 py-2 text-xs text-fg-muted transition hover:border-info hover:text-info-ink sm:px-3"
              >
                <Store className="size-4 sm:hidden" />
                <span className="hidden sm:inline">فروشنده شوید</span>
              </Link>
            )}

            <div className="hidden items-center gap-1.5 sm:flex">
              <Link
                to="/account"
                className="shrink-0 rounded-xl border border-line px-3 py-2 text-xs text-fg-muted transition hover:border-line-strong hover:text-fg"
              >
                {user.name}
              </Link>
              <button
                type="button"
                aria-label="خروج"
                onClick={() => void logout()}
                className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-fg-muted transition hover:border-line-strong hover:text-fg"
              >
                <LogOut className="size-4" />
              </button>
            </div>

            {/* در موبایل، دکمه‌های بالا فشرده می‌شوند و ورود به پنل از این آیکن انجام می‌شود. */}
            <Link
              to="/account"
              aria-label="پنل کاربری"
              className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-fg-muted transition hover:border-line-strong hover:text-fg sm:hidden"
            >
              <User className="size-4" />
            </Link>
          </div>
        ) : (
          <Link
            to="/login"
            aria-label="ورود / ثبت‌نام"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line px-2.5 py-2 text-xs text-fg-muted transition hover:border-line-strong hover:text-fg sm:px-3"
          >
            <User className="size-4" />
            <span className="hidden sm:inline">ورود</span>
          </Link>
        )}
        <ThemeToggle />
        <button
          type="button"
          aria-label={open ? 'بستن فهرست دسته‌بندی‌ها' : 'فهرست دسته‌بندی‌ها'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-xl border text-fg transition',
            open ? 'border-line-strong bg-surface-3' : 'border-line hover:border-line-strong',
          )}
        >
          <Menu className="size-4" />
        </button>
      </div>

      {open && (
        <nav aria-label="دسته‌بندی‌ها" className="border-t border-line bg-surface/95 backdrop-blur-xl">
          <ul className="container-page grid list-none grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-6">
            <li>
              <button
                type="button"
                onClick={() => selectCategory('')}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition',
                  category === ''
                    ? 'border-line-strong bg-surface-3 text-fg'
                    : 'border-line text-fg-muted hover:border-line-strong hover:text-fg',
                )}
              >
                <ShoppingBag className="size-4 shrink-0 text-fg-muted" />
                <span className="truncate">{ALL_ITEMS_LABEL}</span>
              </button>
            </li>
            {CATEGORIES.map((item) => (
              <li key={item.slug}>
                <button
                  type="button"
                  onClick={() => selectCategory(item.slug)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition',
                    category === item.slug
                      ? 'border-line-strong bg-surface-3 text-fg'
                      : 'border-line text-fg-muted hover:border-line-strong hover:text-fg',
                  )}
                >
                  <item.icon className={cn('size-4 shrink-0', item.tint)} />
                  <span className="truncate">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
