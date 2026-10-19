export type ProductImageKey =
  | 'iphone'
  | 'android-phone'
  | 'headphones-max'
  | 'earbuds'
  | 'smartwatch'
  | 'power-bank'
  | 'laptop-pro'
  | 'laptop-dual'
  | 'laptop-ultra'
  | 'laptop-flip'
  | 'tablet-mini'
  | 'tablet-pen'
  | 'blender'
  | 'microwave'
  | 'table-lamp'
  | 'sofa'
  | 'office-chair'
  | 'plant-pot'
  | 'plaid-shirt'
  | 'sneakers'
  | 'high-top'
  | 'handbag'
  | 'sunglasses'
  | 'leather-watch'
  | 'perfume'
  | 'perfume-noir'
  | 'lipstick'
  | 'eyeshadow'
  | 'body-lotion'
  | 'body-wash'
  | 'basketball'
  | 'tennis-racket'
  | 'football'
  | 'volleyball'
  | 'baseball-glove'
  | 'cricket-bat'

export const imagePath = (key: ProductImageKey) => `/products/${key}.webp`

const CATEGORY_POOL: Record<string, ProductImageKey[]> = {
  mobile: ['iphone', 'android-phone', 'headphones-max', 'earbuds', 'smartwatch', 'power-bank'],
  laptop: ['laptop-pro', 'laptop-dual', 'laptop-ultra', 'laptop-flip', 'tablet-mini', 'tablet-pen'],
  home: ['sofa', 'blender', 'microwave', 'table-lamp', 'office-chair', 'plant-pot'],
  fashion: ['handbag', 'sneakers', 'high-top', 'plaid-shirt', 'sunglasses', 'leather-watch'],
  beauty: ['perfume', 'perfume-noir', 'lipstick', 'eyeshadow', 'body-lotion', 'body-wash'],
  sport: ['basketball', 'tennis-racket', 'football', 'volleyball', 'baseball-glove', 'cricket-bat'],
}

export const CATEGORY_COVER: Record<string, ProductImageKey> = {
  mobile: 'iphone',
  laptop: 'laptop-pro',
  home: 'sofa',
  fashion: 'handbag',
  beauty: 'perfume',
  sport: 'basketball',
}

const KEYWORDS: Array<[string[], ProductImageKey]> = [
  [['ایرپاد', 'هندزفری', 'earbud'], 'earbuds'],
  [['هدفون', 'هدست', 'headphone'], 'headphones-max'],
  [['ساعت هوشمند', 'اسمارت', 'smartwatch'], 'smartwatch'],
  [['ساعت'], 'leather-watch'],
  [['پاوربانک', 'پاور بانک', 'شارژر', 'power bank'], 'power-bank'],
  [['آیفون', 'iphone'], 'iphone'],
  [['گوشی', 'موبایل', 'phone'], 'android-phone'],
  [['تبلت', 'tablet', 'ipad'], 'tablet-mini'],
  [['لپ‌تاپ', 'لپ تاپ', 'لپتاپ', 'laptop', 'macbook', 'نوت‌بوک'], 'laptop-pro'],
  [['مخلوط‌کن', 'مخلوط کن', 'blender', 'آبمیوه'], 'blender'],
  [['مایکروفر', 'microwave', 'اجاق'], 'microwave'],
  [['لامپ', 'آباژور', 'چراغ'], 'table-lamp'],
  [['مبل', 'کاناپه', 'sofa'], 'sofa'],
  [['صندلی', 'chair'], 'office-chair'],
  [['گلدان', 'گیاه', 'plant'], 'plant-pot'],
  [['پیراهن', 'shirt'], 'plaid-shirt'],
  [['کتونی', 'کفش', 'sneaker', 'shoe'], 'sneakers'],
  [['کیف', 'bag'], 'handbag'],
  [['عینک', 'sunglass'], 'sunglasses'],
  [['ادکلن', 'عطر', 'perfume'], 'perfume'],
  [['رژ', 'lipstick'], 'lipstick'],
  [['سایه', 'پالت', 'eyeshadow'], 'eyeshadow'],
  [['لوسیون', 'کرم', 'lotion'], 'body-lotion'],
  [['شوینده', 'شامپو', 'بادی واش', 'wash'], 'body-wash'],
  [['بسکتبال', 'basketball'], 'basketball'],
  [['راکت', 'تنیس', 'racket'], 'tennis-racket'],
  [['فوتبال', 'football', 'soccer'], 'football'],
  [['والیبال', 'volleyball'], 'volleyball'],
  [['بیسبال', 'baseball'], 'baseball-glove'],
  [['کریکت', 'cricket'], 'cricket-bat'],
]

const matchKeyword = (name: string): ProductImageKey | null => {
  const haystack = name.toLowerCase()
  const hit = KEYWORDS.find(([words]) => words.some((word) => haystack.includes(word)))
  return hit ? hit[1] : null
}

export const productImageSources = (name: string, category: string, id: number): string[] => {
  const sources: string[] = []
  const byName = matchKeyword(name)
  if (byName) sources.push(imagePath(byName))
  const pool = CATEGORY_POOL[category]
  if (pool) sources.push(imagePath(pool[Math.abs(id) % pool.length]))
  return sources
}

export const categoryImageSources = (category: string): string[] =>
  CATEGORY_COVER[category] ? [imagePath(CATEGORY_COVER[category])] : []
