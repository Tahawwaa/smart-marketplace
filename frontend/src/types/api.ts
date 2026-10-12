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
