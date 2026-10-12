/**
 * نمایش نمونهٔ کارت محصول برای وقتی که API کالایی برنمی‌گرداند.
 * این داده فقط برای دیده‌شدن چیدمان است و جای داده واقعی را نمی‌گیرد.
 */
export type SampleProduct = {
  id: number
  name: string
  category: string
  brand: string
  price: number
  oldPrice?: number
  rating: number
  sold: number
}

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  { id: 1, name: 'گوشی هوشمند سری پرو ۲۵۶ گیگابایت', category: 'mobile', brand: 'سام‌تک', price: 42900000, oldPrice: 46500000, rating: 4.8, sold: 214 },
  { id: 2, name: 'هدفون بی‌سیم نویزکنسلینگ', category: 'mobile', brand: 'آوا', price: 6800000, rating: 4.6, sold: 981 },
  { id: 3, name: 'ساعت هوشمند ورزشی آمولد', category: 'mobile', brand: 'تایمکس', price: 5400000, oldPrice: 6100000, rating: 4.5, sold: 143 },
  { id: 4, name: 'لپ‌تاپ ۱۴ اینچ نسل جدید', category: 'laptop', brand: 'زِنیت', price: 58900000, rating: 4.7, sold: 76 },
  { id: 5, name: 'مانیتور گیمینگ ۲۷ اینچ ۱۶۵ هرتز', category: 'laptop', brand: 'ویوپرو', price: 14200000, oldPrice: 15900000, rating: 4.6, sold: 58 },
  { id: 6, name: 'کیبورد مکانیکال بی‌سیم', category: 'laptop', brand: 'کی‌لاین', price: 3100000, rating: 4.4, sold: 402 },
  { id: 7, name: 'ربات جارو برقی هوشمند', category: 'home', brand: 'کلینکس', price: 18700000, oldPrice: 21000000, rating: 4.5, sold: 121 },
  { id: 8, name: 'قهوه‌ساز اسپرسو نیمه‌اتوماتیک', category: 'home', brand: 'بارِستا', price: 9600000, rating: 4.7, sold: 87 },
  { id: 9, name: 'کاپشن پرپشم زمستانی', category: 'fashion', brand: 'نُرد', price: 3900000, oldPrice: 4700000, rating: 4.3, sold: 264 },
  { id: 10, name: 'کفش رانینگ سبک', category: 'fashion', brand: 'رانوا', price: 2800000, rating: 4.6, sold: 718 },
  { id: 11, name: 'ست مراقبت پوست روزانه', category: 'beauty', brand: 'دِرمی', price: 2300000, rating: 4.5, sold: 533 },
  { id: 12, name: 'ادکلن چوبی ۱۰۰ میلی‌لیتر', category: 'beauty', brand: 'نُت', price: 4100000, oldPrice: 4600000, rating: 4.8, sold: 309 },
  { id: 13, name: 'دمبل قابل تنظیم ۲۴ کیلوگرمی', category: 'sport', brand: 'فیت‌لاین', price: 7400000, rating: 4.6, sold: 64 },
  { id: 14, name: 'چادر کوهنوردی چهارنفره', category: 'sport', brand: 'پیک‌کمپ', price: 8900000, oldPrice: 9800000, rating: 4.4, sold: 41 },
  { id: 15, name: 'پاوربانک ۲۰هزار میلی‌آمپر فست‌شارژ', category: 'mobile', brand: 'آوا', price: 1850000, oldPrice: 2200000, rating: 4.7, sold: 1240 },
  { id: 16, name: 'ماوس بی‌سیم ارگونومیک', category: 'laptop', brand: 'کی‌لاین', price: 1450000, rating: 4.5, sold: 652 },
]
