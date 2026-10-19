import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RemoteImage } from '../../components/ui/remote-image'
import { imagePath } from '../products/images'
import { BANNERS } from './banners'

const INTERVAL_MS = 5500

export function BannerSlider() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = BANNERS.length

  const go = useCallback((next: number) => setIndex((next + count) % count), [count])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (paused || reduced || count < 2) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [paused, count])

  return (
    <section
      className="container-page pt-4 sm:pt-6"
      aria-roledescription="carousel"
      aria-label="بنرهای فروشگاه"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl shadow-[var(--shadow-lg)]">
        <div className="relative h-[19rem] sm:h-[22rem] lg:h-[26rem]">
          {BANNERS.map((banner, position) => {
            const active = position === index
            return (
              <div
                key={banner.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${position + 1} از ${count}`}
                aria-hidden={!active}
                className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
                  active ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                style={{ background: banner.gradient }}
              >
                <div className="grid h-full items-center gap-4 px-6 py-8 text-white sm:px-12 lg:grid-cols-2 lg:px-16">
                  <div className="relative z-10 max-w-xl">
                    <p className="mb-3 text-xs font-bold text-white/80 sm:text-sm">{banner.eyebrow}</p>
                    <h2 className="text-2xl font-black leading-[1.5] sm:text-4xl lg:text-5xl lg:leading-[1.4]">
                      {banner.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/85 sm:text-base">{banner.text}</p>
                    <Link
                      to={banner.to}
                      tabIndex={active ? 0 : -1}
                      className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-6 text-sm font-bold text-slate-900 transition hover:bg-white/90"
                    >
                      {banner.cta}
                    </Link>
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 end-0 hidden w-1/2 items-center justify-center gap-2 sm:flex lg:static lg:w-auto" aria-hidden>
                    {banner.images.map((key, imageIndex) => (
                      <RemoteImage
                        key={key}
                        src={[imagePath(key)]}
                        alt=""
                        className={`object-contain drop-shadow-[0_22px_26px_rgba(0,0,0,0.35)] ${
                          imageIndex === 0 ? 'size-48 lg:size-64' : 'size-28 lg:size-40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="بنر قبلی"
              onClick={() => go(index - 1)}
              className="absolute end-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-900 shadow transition hover:bg-white"
            >
              <ChevronRight className="size-5" />
            </button>
            <button
              type="button"
              aria-label="بنر بعدی"
              onClick={() => go(index + 1)}
              className="absolute start-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-900 shadow transition hover:bg-white"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">
              {BANNERS.map((banner, position) => (
                <button
                  key={banner.id}
                  type="button"
                  aria-label={`بنر ${position + 1}`}
                  aria-current={position === index}
                  onClick={() => go(position)}
                  className="grid h-6 place-items-center px-1"
                >
                  <span
                    className={`block h-2 rounded-full bg-white transition-all ${
                      position === index ? 'w-6 opacity-100' : 'w-2 opacity-55'
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
