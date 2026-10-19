import type { ProductImageKey } from '../products/images'

export type Banner = {
  id: string
  eyebrow: string
  title: string
  text: string
  cta: string
  to: string
  images: ProductImageKey[]
  gradient: string
}

export const BANNERS: Banner[] = [
  {
    id: 'mobile',
    eyebrow: 'موبایل و گجت',
    title: 'جدیدترین گوشی‌ها و لوازم جانبی',
    text: 'از گوشی و ساعت هوشمند تا هدفون و پاوربانک، همه در یک‌جا.',
    cta: 'مشاهده موبایل‌ها',
    to: '/products?category=mobile',
    images: ['iphone', 'smartwatch', 'headphones-max'],
    gradient: 'linear-gradient(120deg, #1e1b4b 0%, #4f46e5 55%, #818cf8 100%)',
  },
  {
    id: 'laptop',
    eyebrow: 'لپ‌تاپ و کامپیوتر',
    title: 'لپ‌تاپ‌هایی برای کار، بازی و خلاقیت',
    text: 'مدل‌های متنوع لپ‌تاپ و تبلت با مشخصات کامل.',
    cta: 'مشاهده لپ‌تاپ‌ها',
    to: '/products?category=laptop',
    images: ['laptop-pro', 'tablet-pen'],
    gradient: 'linear-gradient(120deg, #0c4a6e 0%, #0e8fd1 60%, #67c8f0 100%)',
  },
  {
    id: 'fashion',
    eyebrow: 'مد و پوشاک',
    title: 'استایل خودت را انتخاب کن',
    text: 'کفش، کیف، عینک و پوشاک روزمره.',
    cta: 'مشاهده مد و پوشاک',
    to: '/products?category=fashion',
    images: ['sneakers', 'handbag', 'sunglasses'],
    gradient: 'linear-gradient(120deg, #9a2a10 0%, #ff5a36 60%, #ffa38e 100%)',
  },
  {
    id: 'home',
    eyebrow: 'خانه و آشپزخانه',
    title: 'خانه‌ای دل‌نشین‌تر',
    text: 'مبلمان، روشنایی و لوازم آشپزخانه برای هر سلیقه.',
    cta: 'مشاهده لوازم خانه',
    to: '/products?category=home',
    images: ['sofa', 'table-lamp', 'blender'],
    gradient: 'linear-gradient(120deg, #7a4a05 0%, #d98a0b 60%, #f4c26b 100%)',
  },
  {
    id: 'sport',
    eyebrow: 'ورزش و سفر',
    title: 'تجهیزات ورزشی برای هر رشته',
    text: 'توپ، راکت و وسایل ورزشی مورد نیاز شما.',
    cta: 'مشاهده تجهیزات ورزشی',
    to: '/products?category=sport',
    images: ['basketball', 'tennis-racket', 'football'],
    gradient: 'linear-gradient(120deg, #064e2f 0%, #12a05c 60%, #6fd8a4 100%)',
  },
]
