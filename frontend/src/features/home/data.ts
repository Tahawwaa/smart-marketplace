import {
  Armchair,
  Dumbbell,
  Laptop,
  Shirt,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { CATEGORY_COVER, imagePath } from '../products/images'

export type CategoryItem = {
  slug: string
  name: string
  image: string[]
  icon: LucideIcon
  color: string
  tint: string
}

export const CATEGORIES: CategoryItem[] = [
  { slug: 'mobile', name: 'موبایل و گجت', image: [imagePath(CATEGORY_COVER.mobile)], icon: Smartphone, color: '14, 143, 209', tint: 'text-info' },
  { slug: 'laptop', name: 'لپ‌تاپ و کامپیوتر', image: [imagePath(CATEGORY_COVER.laptop)], icon: Laptop, color: '79, 70, 229', tint: 'text-brand' },
  { slug: 'home', name: 'خانه و آشپزخانه', image: [imagePath(CATEGORY_COVER.home)], icon: Armchair, color: '217, 138, 11', tint: 'text-warning' },
  { slug: 'fashion', name: 'مد و پوشاک', image: [imagePath(CATEGORY_COVER.fashion)], icon: Shirt, color: '255, 90, 54', tint: 'text-accent' },
  { slug: 'beauty', name: 'زیبایی و سلامت', image: [imagePath(CATEGORY_COVER.beauty)], icon: Sparkles, color: '224, 54, 78', tint: 'text-danger' },
  { slug: 'sport', name: 'ورزش و سفر', image: [imagePath(CATEGORY_COVER.sport)], icon: Dumbbell, color: '18, 160, 92', tint: 'text-success' },
]

export const categoryBySlug = (slug: string) => CATEGORIES.find((item) => item.slug === slug)
