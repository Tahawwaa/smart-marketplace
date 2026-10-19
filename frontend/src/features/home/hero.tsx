import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { RemoteImage } from '../../components/ui/remote-image'
import { imagePath, type ProductImageKey } from '../products/images'
import { CATEGORIES } from './data'

const HERO_COLLAGE: Array<{ key: ProductImageKey; position: string; size: string; delay: string }> = [
  { key: 'laptop-pro', position: 'inset-x-0 top-[22%] flex justify-center', size: 'w-[66%] max-w-[20rem]', delay: '0s' },
  { key: 'headphones-max', position: 'end-[5%] top-[6%]', size: 'size-24 sm:size-28', delay: '1.2s' },
  { key: 'smartwatch', position: 'start-[6%] top-[12%]', size: 'size-20 sm:size-24', delay: '2.4s' },
  { key: 'sneakers', position: 'start-[10%] bottom-[16%]', size: 'w-28 sm:w-36', delay: '0.6s' },
  { key: 'perfume', position: 'end-[14%] bottom-[14%]', size: 'size-20 sm:size-24', delay: '1.8s' },
]

export function Hero() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 start-1/2 size-[42rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--brand), transparent 64%)' }}
        />
        <div className="container-page relative grid items-center gap-12 py-12 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div className="animate-fade-up">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="badge badge-brand">
                <Sparkles className="size-3.5" />
                فروشگاه آنلاین
              </span>
            </div>
            <p className="eyebrow mb-3">خوش آمدید</p>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.4] tracking-tight text-fg sm:text-6xl sm:leading-[1.35]">
              بازار هوشمند،
              <br />
              <span className="text-gradient">فروشگاه کالاهای مورد علاقه شما</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-8 text-fg-muted sm:text-base">
              بازار هوشمند مجموعه‌ای گردآوری‌شده از کالاهای متنوع است؛ از موبایل و لپ‌تاپ تا مد،
              خانه و ورزش.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#products" className="btn btn-primary btn-lg shadow-[0_16px_30px_-14px_var(--brand)]">
                شروع خرید
                <ArrowLeft className="size-4" />
              </a>
              <Link to="/account/store" className="btn btn-secondary btn-lg">
                فروشنده شوید
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[30rem] lg:max-w-none" aria-hidden>
            <div className="absolute -inset-6 rounded-[2.5rem] bg-brand-soft/60 blur-2xl" />
            <div className="card relative overflow-hidden rounded-[2rem] border-brand/20 bg-surface/90 p-4 shadow-[var(--shadow-lg)] sm:p-6">
              <div className="absolute -end-12 -top-12 size-40 rounded-full bg-accent/15 blur-2xl" />
              <div className="absolute -bottom-16 -start-10 size-44 rounded-full bg-brand/15 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-fg-subtle">ویترین امروز</p>
                  <p className="mt-1 text-sm font-bold text-fg">پیشنهادهای محبوب</p>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-brand text-brand-fg shadow-[var(--shadow-md)]">
                  <ShoppingBag className="size-5" />
                </span>
              </div>
              <div className="relative mt-5 aspect-[1.1] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-soft via-surface-2 to-accent-soft">
                <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 50% 46%, var(--surface), transparent 52%)' }} />
                {HERO_COLLAGE.map((item) => (
                  <div
                    key={item.key}
                    className={`animate-float absolute ${item.position}`}
                    style={{ animationDelay: item.delay }}
                  >
                    <RemoteImage
                      src={[imagePath(item.key)]}
                      alt=""
                      className={`${item.size} object-contain drop-shadow-[0_18px_22px_rgba(15,23,42,0.28)]`}
                    />
                  </div>
                ))}
              </div>
              <div className="relative mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-fg-subtle">فروشگاه آنلاین</p>
                  <p className="mt-1 text-lg font-black text-fg">بازار هوشمند</p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-success-soft text-success-ink">
                  <TrendingUp className="size-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pt-12" aria-labelledby="home-categories">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">دسته‌بندی‌ها</p>
            <h2 id="home-categories" className="section-title mt-1">
              از کجا شروع کنیم؟
            </h2>
          </div>
          <Link to="/products" className="text-xs font-bold text-brand hover:underline">
            همه کالاها
          </Link>
        </div>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link
                to={`/products?category=${category.slug}`}
                className="card card-hover group flex flex-col items-center gap-3 px-3 py-5 text-center"
              >
                <span
                  className="grid size-24 place-items-center overflow-hidden rounded-2xl p-2.5"
                  style={{
                    background: `radial-gradient(circle at 50% 35%, rgba(${category.color}, 0.08), rgba(${category.color}, 0.22))`,
                  }}
                >
                  <RemoteImage
                    src={category.image}
                    alt={category.name}
                    className="size-full object-contain drop-shadow-[0_8px_10px_rgba(15,23,42,0.25)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-110"
                    fallback={<category.icon className={`size-7 ${category.tint}`} />}
                  />
                </span>
                <span className="text-xs font-bold text-fg">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
