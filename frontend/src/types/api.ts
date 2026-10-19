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
  images?: ProductImage[]
  brand?: { id: number; name: string; slug: string } | null
  category?: { id: number; name: string; slug: string } | null
}

export type SearchSuggestions = {
  products: { id: number; name: string; slug: string; category: string | null; image: string | null }[]
  categories: { id: number; name: string; slug: string }[]
  brands: { id: number; name: string; slug: string }[]
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
  phone?: string | null
  role?: string
  /** فروشگاه کاربر؛ اگر باز نکرده باشد `null` است. وجود همین مقدار یعنی فروشنده است. */
  store?: VendorSummary | null
}

export type VendorSummary = {
  id: number
  store_name: string
  slug: string
  status: string
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

export type Vendor = {
  id: number
  store_name: string
  slug: string
  commission_rate: number
  bank_sheba: string | null
  status: string
  approved_at: string | null
  created_at: string | null
}

export type VendorProfileResponse = { data: Vendor | null }

export type VendorVariantInventory = {
  id: number
  price: number
  sale_price: number | null
  effective_price: number
  quantity: number
  reserved_quantity: number
  available_quantity: number
  lead_time_days: number | null
  is_available: boolean
}

export type VendorVariant = {
  id: number
  sku: string | null
  barcode: string | null
  weight_grams: number | null
  is_active: boolean
  inventories?: VendorVariantInventory[]
}

export type VendorProduct = {
  id: number
  name: string
  slug: string
  description: string | null
  status: string
  is_active: boolean
  meta_title?: string | null
  meta_description?: string | null
  category?: { id: number; name: string; slug: string } | null
  brand?: { id: number; name: string; slug: string } | null
  variants?: VendorVariant[]
  created_at: string | null
  updated_at: string | null
}

export type VendorStock = {
  id: number
  vendor_inventory_id: number
  variant_id: number
  price: number
  sale_price: number | null
  effective_price: number
  quantity: number
  reserved_quantity: number
  available_quantity: number
  lead_time_days: number
  is_available: boolean
  lock_version: number
  variant: {
    id: number
    sku: string | null
    product: { id: number; name: string; slug: string } | null
  } | null
  warranty: { id: number; name: string; duration_months: number | null } | null
}

export type VendorSubOrder = {
  id: number
  sub_order_number: string
  status: string
  subtotal_price: number
  shipping_fee: number
  commission_rate: number
  commission_amount: number
  vendor_net_amount: number
  created_at: string | null
  order: {
    id: number
    order_number: string
    status: string
    payment_status: string
    shipping_address_snapshot: Partial<Address> & { address_id?: number }
    user: { id: number; name: string; email: string; phone: string | null } | null
    created_at: string | null
  } | null
  items?: OrderItem[]
}

export type Payment = {
  id: number
  order_id: number
  gateway_name: string
  reference_id: string | null
  transaction_id: string | null
  amount: number
  status: string
  paid_at: string | null
  created_at: string | null
}

export type PaymentStartResponse = { data: Payment; redirect_url: string | null }

export type AdminDashboard = {
  cards: {
    revenue_total: number
    revenue_today: number
    revenue_30_days: number
    orders_total: number
    orders_today: number
    customers_total: number
    vendors_total: number
    vendors_pending: number
    products_total: number
    products_pending: number
    low_stock_variants: number
  }
  revenue_trend: { date: string; revenue: number; orders: number }[]
  order_status_breakdown: { status: string; count: number }[]
  top_vendors: {
    vendor: { id: number; store_name: string; slug: string } | null
    gross: number
    commission: number
    orders: number
  }[]
  recent_orders: {
    id: number
    order_number: string
    status: string
    payment_status: string
    grand_total: number
    items_count: number
    customer: { id: number; name: string; email: string } | null
    created_at: string | null
  }[]
  pending_queues: { vendors: number; products: number; unpaid_orders: number }
}

export type AdminUser = {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  is_active: boolean
  email_verified_at: string | null
  orders_count?: number
  vendors?: { id: number; store_name: string; slug: string; status: string }[]
  created_at: string | null
}

export type AdminVendor = {
  id: number
  store_name: string
  slug: string
  commission_rate: number
  bank_sheba: string | null
  status: string
  approved_at: string | null
  products_count?: number
  inventories_count?: number
  user?: { id: number; name: string; email: string } | null
  created_at: string | null
}

export type AdminProduct = {
  id: number
  name: string
  slug: string
  description: string | null
  status: string
  is_active: boolean
  brand?: { id: number; name: string; slug: string } | null
  category?: { id: number; name: string; slug: string } | null
  vendor?: { id: number; store_name: string; slug: string } | null
  variants?: ProductVariant[]
  created_at: string | null
  updated_at: string | null
}

export type AdminOrder = {
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
  user?: { id: number; name: string; email: string; phone: string | null } | null
  sub_orders?: SubOrder[]
  created_at: string | null
  updated_at: string | null
}

export type AdminCategory = {
  id: number
  name: string
  slug: string
  depth: number
  sort_order: number
  is_active: boolean
  parent_id: number | null
  products_count?: number
  created_at: string | null
}

export type AdminBrand = {
  id: number
  name: string
  slug: string
  logo_path: string | null
  is_active: boolean
  products_count?: number
  created_at: string | null
}
