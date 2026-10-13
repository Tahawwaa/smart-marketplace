export type ApiList<T> = {
  data: T[]
  meta?: { current_page: number; last_page: number; per_page: number; total: number }
}

export type ApiItem<T> = { data: T }

export type Category = {
  id: number
  name: string
  slug: string
  depth: number
  parent_id: number | null
  children?: Category[]
}

export type Product = {
  id: number
  name: string
  slug: string
  description: string | null
  price_from?: number | null
  brand?: { id: number; name: string; slug: string } | null
  category?: { id: number; name: string; slug: string } | null
}

export type ProductImage = {
  id: number
  path: string
  alt: string | null
  sort_order: number
  is_primary: boolean
}

export type ProductVariant = {
  id: number
  sku: string | null
  barcode: string | null
  weight_grams: number | null
  is_active: boolean
  attributes?: { slug: string; name: string; values: { id: number; value: string; color_code: string | null }[] }[]
  inventories?: { id: number; price: number | null; quantity: number }[]
}

export type ProductDetail = Product & {
  status?: string | null
  is_active?: boolean
  meta_title?: string | null
  meta_description?: string | null
  images?: ProductImage[]
  variants?: ProductVariant[]
  created_at?: string | null
  updated_at?: string | null
}

export type User = {
  id: number
  name: string
  email: string
  role?: string
}

export type AuthResponse = {
  user: User
  token: string
  token_type: string
}

export type OrderItem = {
  id: number
  product_name: string
  quantity: number
  unit_price: number
  total: number
}

export type Order = {
  id: number
  number: string
  status: string
  total: number
  items_count?: number
  created_at: string
  items?: OrderItem[]
}
