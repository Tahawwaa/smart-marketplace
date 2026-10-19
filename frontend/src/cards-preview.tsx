import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import './index.css'
import { CATEGORIES } from './features/home/data'
import { imagePath } from './features/products/images'
import { ProductCard, type ProductCardData } from './features/products/product-card'
import { SAMPLE_PRODUCTS } from './features/products/sample'

const pick = new URLSearchParams(location.search).get('category') ?? ''

const cards: ProductCardData[] = SAMPLE_PRODUCTS.filter((product) => !pick || product.category === pick)
  .slice(0, 8)
  .map((product, index) => ({
    id: product.id,
    slug: index % 3 === 2 ? undefined : `p-${product.id}`,
    name: product.name,
    categorySlug: product.category,
    categoryName: CATEGORIES.find((item) => item.slug === product.category)?.name ?? '',
    brandName: product.brand,
    price: index === 4 ? null : product.price,
    oldPrice: product.oldPrice,
    rating: product.rating,
    sold: product.sold,
    imageSources: [imagePath(product.image)],
  }))

createRoot(document.getElementById('root')!).render(
  <MemoryRouter>
    <div className="container-page py-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((card, index) => (
          <ProductCard key={card.id} product={card} index={index} />
        ))}
      </div>
    </div>
  </MemoryRouter>,
)
