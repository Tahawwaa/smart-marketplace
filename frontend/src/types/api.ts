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
  inventories?: VendorInventory[]
}

export type VendorInventory = {
  id: number
  price: number
  sale_price: number | null
  effective_price: number
  available_quantity: number
  lead_time_days: number | null
  is_available: boolean
  vendor?: { id: number; store_name: string; slug: string } | null
  warranty?: { id: number; name: string; duration_months: number | null } | null
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

export type CartItem = {
  id: number
  vendor_inventory_id: number
  quantity: number
  unit_price: number
  unit_price_snapshot: number | null
  total_price: number
  available_quantity: number | null
  product: { id: number; name: string; slug: string } | null
  variant: { id: number; sku: string | null } | null
  vendor: { id: number; store_name: string; slug: string } | null
}

export type Cart = {
  id: number
  items: CartItem[]
  items_count: number
  total_quantity: number
  subtotal: number
  currency: string
  expires_at: string | null
}

export type Address = {
  id: number
  title: string | null
  province: string
  city: string
  postal_code: string | null
  address_line: string
  recipient_name: string
  recipient_phone: string
  is_default: boolean
}

export type AddressInput = {
  title?: string | null
  province: string
  city: string
  postal_code?: string | null
  address_line: string
  recipient_name: string
  recipient_phone: string
  is_default?: boolean
}

export type OrderItem = {
  id: number
  vendor_inventory_id: number
  product_name_snapshot: string
  variant_sku_snapshot: string | null
  selected_attributes_snapshot: Record<string, unknown> | null
  unit_price: number
  quantity: number
  total_price: number
}

export type SubOrder = {
  id: number
  sub_order_number: string
  status: string
  subtotal_price: number
  shipping_fee: number
  commission_rate: number
  commission_amount: number
  vendor_net_amount: number
  vendor?: { id: number; store_name: string; slug: string } | null
  items?: OrderItem[]
}

export type Order = {
  id: number
  order_number: string
  status: string
  payment_status: string
  total_items_price: number
  total_shipping_fee: number
  discount_total: number
  tax_total: number
  grand_total: number
  currency: string
  shipping_address_snapshot: Partial<Address> & { address_id?: number }
  items_count?: number
  sub_orders?: SubOrder[]
  created_at: string | null
  updated_at: string | null
}
