import {
  Armchair,
  Dumbbell,
  Laptop,
  Shirt,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export type CategoryItem = {
  slug: string
  name: string
  icon: LucideIcon
  color: string
  tint: string
}

export const CATEGORIES: CategoryItem[] = [
  { slug: 'mobile', name: 'موبایل و گجت', icon: Smartphone, color: '24, 204, 252', tint: 'text-cyan-300' },
  { slug: 'laptop', name: 'لپ‌تاپ و کامپیوتر', icon: Laptop, color: '99, 102, 241', tint: 'text-indigo-300' },
  { slug: 'home', name: 'خانه و آشپزخانه', icon: Armchair, color: '251, 191, 36', tint: 'text-amber-300' },
  { slug: 'fashion', name: 'مد و پوشاک', icon: Shirt, color: '217, 70, 239', tint: 'text-fuchsia-300' },
  { slug: 'beauty', name: 'زیبایی و سلامت', icon: Sparkles, color: '251, 113, 133', tint: 'text-rose-300' },
  { slug: 'sport', name: 'ورزش و سفر', icon: Dumbbell, color: '52, 211, 153', tint: 'text-emerald-300' },
]

export const categoryBySlug = (slug: string) => CATEGORIES.find((item) => item.slug === slug)
