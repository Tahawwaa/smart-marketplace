import { Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES } from '../../features/home/data'
import { cn } from '../../lib/cn'

type Props = {
  category: string
  search: string
  onSearch: (term: string) => void
  onSelectCategory: (slug: string) => void
}

export function SiteHeader({ category, search, onSearch, onSelectCategory }: Props) {
  const [input, setInput] = useState(search)
  const [open, setOpen] = useState(false)

  // Keep the field in sync when the term is changed from outside (e.g. cleared elsewhere).
  const [seenSearch, setSeenSearch] = useState(search)
  if (seenSearch !== search) {
    setSeenSearch(search)
    setInput(search)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    onSearch(input.trim())
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <a href="#top" className="flex shrink-0 items-center gap-2 text-sm font-extrabold text-white">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500">
            <ShoppingBag className="size-4" />
          </span>
          <span className="hidden sm:inline">بازار هوشمند</span>
        </a>

        <form
          onSubmit={submit}
          role="search"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 transition focus-within:border-white/25"
        >
          <Search className="size-4 shrink-0 text-neutral-500" />
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="جست‌وجوی نام کالا یا برند…"
            aria-label="جست‌وجوی کالا"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
          />
          {input && (
            <button
              type="button"
              aria-label="پاک‌کردن جست‌وجو"
              onClick={() => {
                setInput('')
                onSearch('')
              }}
              className="grid size-6 shrink-0 place-items-center rounded-full text-neutral-500 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>

        <button
          type="button"
          className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-neutral-300 transition hover:border-white/25 hover:text-white sm:flex"
        >
          <User className="size-4" />
          ورود
        </button>
        <button
          type="button"
          aria-label={open ? 'بستن فهرست دسته‌بندی‌ها' : 'فهرست دسته‌بندی‌ها'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-xl border text-white transition',
            open ? 'border-white/25 bg-white/10' : 'border-white/10 hover:border-white/25',
          )}
        >
          <Menu className="size-4" />
        </button>
      </div>

      {open && (
        <nav aria-label="دسته‌بندی‌ها" className="border-t border-white/[0.06] bg-neutral-950/95">
          <ul className="mx-auto grid max-w-6xl list-none grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((item) => (
              <li key={item.slug}>
                <a
                  href="#products"
                  onClick={() => {
                    onSelectCategory(item.slug)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition',
                    category === item.slug
                      ? 'border-white/25 bg-white/10 text-white'
                      : 'border-white/[0.07] text-neutral-400 hover:border-white/20 hover:text-white',
                  )}
                >
                  <item.icon className={cn('size-4 shrink-0', item.tint)} />
                  <span className="truncate">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
