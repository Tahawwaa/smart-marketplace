import { LayoutDashboard, LogOut, Menu, Search, ShoppingBag, Store, User, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/auth-context'
import { fetchSuggestions } from '../../features/products/api'
import type { SearchSuggestions } from '../../types/api'
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
  const [suggestionResult, setSuggestions] = useState<{ term: string; data: SearchSuggestions } | null>(null)
  const suggestions = suggestionResult?.term === input.trim() ? suggestionResult.data : null
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const term = input.trim()
    if (term.length < 2) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetchSuggestions(term, controller.signal)
        .then((response) => {
          if (controller.signal.aborted) return
          setSuggestions({ term, data: response.data })
          setActive(-1)
        })
        .catch(() => undefined)
    }, 250)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [input])

  const suggestionLinks = suggestions && input.trim().length >= 2
    ? [
        ...suggestions.products.map((item) => ({
          key: `p${item.id}`,
          label: item.name,
          hint: item.category ?? 'کالا',
          to: `/products/${item.slug}`,
        })),
        ...suggestions.categories.map((item) => ({
          key: `c${item.id}`,
          label: item.name,
          hint: 'دسته‌بندی',
          to: `/products?category=${item.slug}`,
        })),
        ...suggestions.brands.map((item) => ({
          key: `b${item.id}`,
          label: item.name,
          hint: 'برند',
          to: `/products?brand=${item.slug}`,
        })),
      ]
    : []
  const showSuggestions = focused && suggestionLinks.length > 0

  function goTo(target: string) {
    setFocused(false)
    navigate(target)
  }

  function onInputKeyDown(event: React.KeyboardEvent) {
    if (!showSuggestions) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((value) => (value + 1) % suggestionLinks.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((value) => (value <= 0 ? suggestionLinks.length - 1 : value - 1))
    } else if (event.key === 'Enter' && active >= 0 && suggestionLinks[active]) {
      event.preventDefault()
      goTo(suggestionLinks[active].to)
    } else if (event.key === 'Escape') {
      setFocused(false)
    }
  }

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
    setFocused(false)
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
      <div className="container-page flex flex-wrap items-center gap-x-2 gap-y-2.5 py-2.5 sm:flex-nowrap sm:gap-3 sm:py-3">
        <Link to="/" className="me-auto flex shrink-0 items-center gap-2 text-sm font-extrabold text-fg sm:me-0">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-fg shadow-[var(--shadow-md)]">
            <ShoppingBag className="size-5" />
          </span>
          <span>tahajorablo</span>
        </Link>

        <form
          onSubmit={submit}
          role="search"
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
          }}
          className="relative order-last flex w-full min-w-0 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 transition focus-within:border-brand focus-within:bg-surface focus-within:shadow-[0_0_0_4px_var(--ring)] sm:order-none sm:w-auto sm:flex-1"
        >
          <Search className="size-4 shrink-0 text-fg-subtle" />
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onInputKeyDown}
            autoComplete="off"
            placeholder="جست‌وجوی نام کالا یا برند…"
            aria-label="جست‌وجوی کالا"
            className="min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle sm:text-sm"
          />
          {input && (
            <button
              type="button"
              aria-label="پاک‌کردن جست‌وجو"
              onClick={() => {
                setInput('')
                navigate('/products')
              }}
              className="grid size-8 shrink-0 place-items-center rounded-full text-fg-subtle transition hover:bg-surface-3 hover:text-fg sm:size-6"
            >
              <X className="size-3.5" />
            </button>
          )}
          {showSuggestions && (
            <ul
              role="listbox"
              className="absolute inset-x-0 top-full z-50 mt-2 max-h-[60vh] list-none overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-md)]"
            >
              {suggestionLinks.map((item, index) => (
                <li key={item.key} role="option" aria-selected={index === active}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goTo(item.to)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-start text-xs transition sm:py-2',
                      index === active ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:bg-surface-2',
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="shrink-0 text-[10px] text-fg-subtle">{item.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
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
                className="alert alert-info hidden !py-2 !text-xs sm:block"
              >
                پنل مدیریت
              </Link>
            ) : null}

            {/* فروشندگی با «وجود فروشگاه» تعیین می‌شود، نه با نقش حساب. */}
            {user.store ? (
              <Link
                to="/vendor"
                title="پنل فروشنده"
                className="alert alert-info hidden !py-2 !text-xs sm:block"
              >
                پنل فروشنده
              </Link>
            ) : (
              <Link
                to="/account/store"
                title="فروشنده شوید"
                className="hidden items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs text-fg-muted transition hover:border-info hover:text-info-ink sm:flex"
              >
                فروشنده شوید
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

          </div>
        ) : (
          <Link
            to="/login"
            aria-label="ورود / ثبت‌نام"
            className="flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line text-xs text-fg-muted transition hover:border-line-strong hover:text-fg sm:size-auto sm:px-3 sm:py-2"
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
          <ul className="container-page grid max-h-[65vh] list-none grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-6">
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
          {user ? (
            <div className="container-page flex flex-col gap-2 border-t border-line pb-4 pt-3 sm:hidden">
              <p className="truncate text-xs text-fg-subtle">{user.name}</p>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/account" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
                  <User className="size-4" />
                  پنل کاربری
                </Link>
                {user.role === 'admin' ? (
                  <Link to="/admin" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
                    <LayoutDashboard className="size-4" />
                    پنل مدیریت
                  </Link>
                ) : null}
                {user.store ? (
                  <Link to="/vendor" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
                    <Store className="size-4" />
                    پنل فروشنده
                  </Link>
                ) : (
                  <Link to="/account/store" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
                    <Store className="size-4" />
                    فروشنده شوید
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    void logout()
                  }}
                  className="btn btn-danger btn-sm"
                >
                  <LogOut className="size-4" />
                  خروج
                </button>
              </div>
            </div>
          ) : null}
        </nav>
      )}
    </header>
  )
}
