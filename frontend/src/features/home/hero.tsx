import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  Headphones,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { RemoteImage } from '../../components/ui/remote-image'
import { imagePath, type ProductImageKey } from '../products/images'
import { CATEGORIES } from './data'

const PERKS = [
  { icon: Truck, title: 'ارسال سریع', text: 'به سراسر کشور' },
  { icon: ShieldCheck, title: 'پرداخت امن', text: 'درگاه معتبر بانکی' },
  { icon: BadgeCheck, title: 'اصالت کالا', text: 'فروشندگان تأییدشده' },
  { icon: Headphones, title: 'پشتیبانی', text: 'پاسخ‌گویی همیشگی' },
]

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
                بازار آنلاین چندفروشندگی
              </span>
              <span className="badge badge-success">
                <Zap className="size-3.5" />
                ارسال از امروز
              </span>
            </div>
            <p className="eyebrow mb-3">انتخاب بهتر، خرید مطمئن‌تر</p>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.4] tracking-tight text-fg sm:text-6xl sm:leading-[1.35]">
              خرید هوشمند،
              <br />
              <span className="text-gradient">شروع یک انتخاب خوب</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-8 text-fg-muted sm:text-base">
              کالاهای محبوب را از فروشندگان معتبر پیدا کنید، قیمت‌ها را کنار هم ببینید و با چند
              کلیک سفارش خود را ثبت کنید.
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
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-6">
              <div>
                <p className="text-xl font-black tabular-nums text-fg">+۱۰۰۰</p>
                <p className="mt-1 text-[11px] text-fg-subtle">کالای قابل انتخاب</p>
              </div>
              <div>
                <p className="text-xl font-black tabular-nums text-fg">+۵۰۰</p>
                <p className="mt-1 text-[11px] text-fg-subtle">فروشنده فعال</p>
              </div>
              <div>
                <p className="text-xl font-black tabular-nums text-fg">۲۴/۷</p>
                <p className="mt-1 text-[11px] text-fg-subtle">پشتیبانی آنلاین</p>
              </div>
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
                <span className="absolute start-4 top-4 badge badge-accent">تا ۳۰٪ تخفیف</span>
                <span className="absolute bottom-4 end-4 flex items-center gap-1 rounded-full bg-surface/90 px-3 py-1.5 text-[11px] font-bold text-warning-ink shadow-[var(--shadow-sm)] backdrop-blur">
                  <Star className="size-3.5 fill-current" />
                  ۴.۸ از ۵
                </span>
                <span className="absolute bottom-4 start-4 flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-[11px] font-bold text-fg shadow-[var(--shadow-sm)] backdrop-blur">
                  <Boxes className="size-3.5 text-brand" />
                  +۱۰۰۰ کالا
                </span>
              </div>
              <div className="relative mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-fg-subtle">تجربه‌ای برای خرید روزمره</p>
                  <p className="mt-1 text-lg font-black text-fg">هر چیزی که لازم دارید</p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-success-soft text-success-ink">
                  <TrendingUp className="size-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page -mt-6 sm:-mt-8">
        <ul className="card relative z-10 m-0 grid list-none grid-cols-2 gap-4 p-4 shadow-[var(--shadow-md)] sm:grid-cols-4 sm:p-5">
          {PERKS.map((perk) => (
            <li key={perk.title} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                <perk.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-fg">{perk.title}</span>
                <span className="block truncate text-[11px] text-fg-subtle">{perk.text}</span>
              </span>
            </li>
          ))}
        </ul>
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
