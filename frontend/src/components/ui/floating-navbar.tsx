import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'

const LINKS = [
  { label: 'امکانات', href: '#features' },
  { label: 'نحوه کار', href: '#how' },
  { label: 'فروشندگان', href: '#vendors' },
  { label: 'نظرات', href: '#reviews' },
  { label: 'سوالات', href: '#faq' },
]

export function FloatingNavbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (value) => setScrolled(value > 40))

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      <nav
        className={`relative flex w-full max-w-4xl items-center justify-between gap-4 rounded-full border px-3 py-2 pe-2 ps-5 backdrop-blur-xl transition-all duration-300 ${
          scrolled ? 'border-white/15 bg-neutral-950/80 shadow-[0_8px_40px_rgba(99,68,245,0.25)]' : 'border-white/[0.07] bg-white/[0.03]'
        }`}
      >
        <a href="#top" className="flex items-center gap-2 text-sm font-extrabold text-white">
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500">
            <ShoppingBag className="size-4" />
          </span>
          بازار هوشمند
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-[13px] text-neutral-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#cta"
            className="hidden rounded-full bg-white px-4 py-2 text-[13px] font-bold text-black transition hover:bg-neutral-200 sm:inline-block"
          >
            شروع رایگان
          </a>
          <button
            type="button"
            aria-label="منو"
            onClick={() => setOpen((value) => !value)}
            className="grid size-9 place-items-center rounded-full border border-white/10 text-white md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className="absolute inset-x-0 top-full mt-2 space-y-1 rounded-3xl border border-white/10 bg-neutral-950/95 p-3 backdrop-blur-xl md:hidden"
            >
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl px-4 py-3 text-sm text-neutral-300 hover:bg-white/[0.06]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}
