import { Link } from 'react-router-dom'
import { RemoteImage } from '../../components/ui/remote-image'
import { CATEGORIES } from './data'
import { BannerSlider } from './banner-slider'

export function Hero() {
  return (
    <>
      <BannerSlider />
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
