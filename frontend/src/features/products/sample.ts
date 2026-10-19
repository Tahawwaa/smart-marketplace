/**
 * نمایش نمونهٔ کارت محصول برای وقتی که API کالایی برنمی‌گرداند.
 * این داده فقط برای دیده‌شدن چیدمان است و جای داده واقعی را نمی‌گیرد.
 */
import type { ProductImageKey } from './images'

export type SampleProduct = {
  id: number
  name: string
  category: string
  brand: string
  price: number
  oldPrice?: number
  rating: number
  sold: number
  image: ProductImageKey
}

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  { id: 1, name: 'گوشی هوشمند پرچم‌دار ۲۵۶ گیگابایت', category: 'mobile', brand: 'سام‌تک', price: 42900000, oldPrice: 46500000, rating: 4.8, sold: 214, image: 'iphone' },
  { id: 2, name: 'گوشی اندروید ۱۲۸ گیگابایت دوربین سه‌گانه', category: 'mobile', brand: 'نووا', price: 15800000, rating: 4.5, sold: 389, image: 'android-phone' },
  { id: 3, name: 'هدفون بی‌سیم نویزکنسلینگ اورایر', category: 'mobile', brand: 'آوا', price: 6800000, oldPrice: 7600000, rating: 4.6, sold: 981, image: 'headphones-max' },
  { id: 4, name: 'هندزفری بی‌سیم با کیس شارژ', category: 'mobile', brand: 'آوا', price: 3200000, rating: 4.4, sold: 1320, image: 'earbuds' },
  { id: 5, name: 'ساعت هوشمند ورزشی نمایشگر آمولد', category: 'mobile', brand: 'تایمکس', price: 5400000, oldPrice: 6100000, rating: 4.5, sold: 143, image: 'smartwatch' },
  { id: 6, name: 'پاوربانک مغناطیسی فست‌شارژ', category: 'mobile', brand: 'آوا', price: 1850000, oldPrice: 2200000, rating: 4.7, sold: 1240, image: 'power-bank' },
  { id: 7, name: 'لپ‌تاپ ۱۴ اینچ نمایشگر لیکوئید', category: 'laptop', brand: 'زِنیت', price: 89900000, oldPrice: 96000000, rating: 4.9, sold: 76, image: 'laptop-pro' },
  { id: 8, name: 'لپ‌تاپ دو صفحه‌ای مخصوص خلاقان', category: 'laptop', brand: 'ویوپرو', price: 74500000, rating: 4.7, sold: 38, image: 'laptop-dual' },
  { id: 9, name: 'لپ‌تاپ گیمینگ باریک نسل جدید', category: 'laptop', brand: 'زِنیت', price: 58900000, oldPrice: 63500000, rating: 4.6, sold: 92, image: 'laptop-ultra' },
  { id: 10, name: 'لپ‌تاپ سبک ۱۵ اینچ دانشجویی', category: 'laptop', brand: 'کی‌لاین', price: 31200000, rating: 4.4, sold: 211, image: 'laptop-flip' },
  { id: 11, name: 'تبلت ۸ اینچ نمایشگر لمسی', category: 'laptop', brand: 'نووا', price: 17400000, rating: 4.5, sold: 164, image: 'tablet-mini' },
  { id: 12, name: 'تبلت قلم‌دار ۱۲ اینچ', category: 'laptop', brand: 'سام‌تک', price: 24800000, oldPrice: 27000000, rating: 4.6, sold: 87, image: 'tablet-pen' },
  { id: 13, name: 'مخلوط‌کن حرفه‌ای با پارچ شیشه‌ای', category: 'home', brand: 'کلینکس', price: 4200000, rating: 4.5, sold: 305, image: 'blender' },
  { id: 14, name: 'مایکروفر رومیزی ۲۰ لیتری', category: 'home', brand: 'بارِستا', price: 9600000, oldPrice: 10800000, rating: 4.4, sold: 121, image: 'microwave' },
  { id: 15, name: 'آباژور رومیزی کلاسیک', category: 'home', brand: 'نورسا', price: 2100000, rating: 4.3, sold: 98, image: 'table-lamp' },
  { id: 16, name: 'کاناپه سه‌نفره چوبی', category: 'home', brand: 'آرمان‌چوب', price: 38500000, oldPrice: 42000000, rating: 4.7, sold: 34, image: 'sofa' },
  { id: 17, name: 'صندلی مدیریتی ارگونومیک', category: 'home', brand: 'آرمان‌چوب', price: 12400000, rating: 4.6, sold: 156, image: 'office-chair' },
  { id: 18, name: 'گلدان بزرگ همراه گیاه تزیینی', category: 'home', brand: 'سبزینه', price: 1450000, rating: 4.8, sold: 423, image: 'plant-pot' },
  { id: 19, name: 'پیراهن چهارخانه نخی مردانه', category: 'fashion', brand: 'نُرد', price: 1900000, oldPrice: 2400000, rating: 4.3, sold: 264, image: 'plaid-shirt' },
  { id: 20, name: 'کفش کتانی راحتی سفید', category: 'fashion', brand: 'رانوا', price: 2800000, rating: 4.6, sold: 718, image: 'sneakers' },
  { id: 21, name: 'کفش ساقدار اسپرت قرمز', category: 'fashion', brand: 'رانوا', price: 4600000, oldPrice: 5200000, rating: 4.7, sold: 402, image: 'high-top' },
  { id: 22, name: 'کیف دستی زنانه چرم مصنوعی', category: 'fashion', brand: 'لورا', price: 3900000, rating: 4.5, sold: 187, image: 'handbag' },
  { id: 23, name: 'عینک آفتابی کلاسیک UV400', category: 'fashion', brand: 'ویستا', price: 1350000, rating: 4.4, sold: 533, image: 'sunglasses' },
  { id: 24, name: 'ساعت مچی کرنوگراف بند چرم', category: 'fashion', brand: 'تایمکس', price: 8700000, oldPrice: 9900000, rating: 4.8, sold: 76, image: 'leather-watch' },
  { id: 25, name: 'ادکلن زنانه گل و میوه ۱۰۰ میلی‌لیتر', category: 'beauty', brand: 'نُت', price: 4100000, oldPrice: 4600000, rating: 4.8, sold: 309, image: 'perfume' },
  { id: 26, name: 'ادکلن شب مشکی ۵۰ میلی‌لیتر', category: 'beauty', brand: 'نُت', price: 6200000, rating: 4.7, sold: 211, image: 'perfume-noir' },
  { id: 27, name: 'رژ لب مات ماندگار', category: 'beauty', brand: 'دِرمی', price: 690000, rating: 4.5, sold: 1180, image: 'lipstick' },
  { id: 28, name: 'پالت سایه چشم ۱۶ رنگ', category: 'beauty', brand: 'دِرمی', price: 1250000, oldPrice: 1500000, rating: 4.6, sold: 642, image: 'eyeshadow' },
  { id: 29, name: 'لوسیون بدن مردانه مرطوب‌کننده', category: 'beauty', brand: 'پوست‌نو', price: 480000, rating: 4.4, sold: 905, image: 'body-lotion' },
  { id: 30, name: 'ژل شست‌وشوی بدن با عصاره پرتقال', category: 'beauty', brand: 'پوست‌نو', price: 390000, rating: 4.3, sold: 756, image: 'body-wash' },
  { id: 31, name: 'توپ بسکتبال سایز ۷ مسابقه‌ای', category: 'sport', brand: 'فیت‌لاین', price: 2300000, oldPrice: 2700000, rating: 4.7, sold: 188, image: 'basketball' },
  { id: 32, name: 'راکت تنیس سبک حرفه‌ای', category: 'sport', brand: 'پیک‌کمپ', price: 3400000, rating: 4.5, sold: 64, image: 'tennis-racket' },
  { id: 33, name: 'توپ فوتبال چرمی سایز ۵', category: 'sport', brand: 'فیت‌لاین', price: 1650000, rating: 4.6, sold: 497, image: 'football' },
  { id: 34, name: 'توپ والیبال ساحلی', category: 'sport', brand: 'پیک‌کمپ', price: 1480000, oldPrice: 1700000, rating: 4.4, sold: 233, image: 'volleyball' },
  { id: 35, name: 'دستکش بیسبال چرمی', category: 'sport', brand: 'فیت‌لاین', price: 2750000, rating: 4.5, sold: 52, image: 'baseball-glove' },
  { id: 36, name: 'چوب کریکت ویلو انگلیسی', category: 'sport', brand: 'پیک‌کمپ', price: 5900000, rating: 4.3, sold: 29, image: 'cricket-bat' },
]
