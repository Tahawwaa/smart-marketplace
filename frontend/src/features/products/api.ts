import { api } from '../../lib/api/client'
import type { ApiItem, ApiList, Category, Product, ProductDetail } from '../../types/api'

export const fetchCategories = (signal?: AbortSignal) => api<ApiList<Category>>('/categories', { signal })

export type ProductQuery = {
  category?: string
  brand?: string
  search?: string
  sort?: string
  per_page?: number
  page?: number
}

export const fetchProducts = (params: ProductQuery, signal?: AbortSignal) =>
  api<ApiList<Product>>('/products', { query: params, signal })

export const fetchProductCount = async (params: ProductQuery, signal?: AbortSignal) => {
  const response = await fetchProducts({ ...params, per_page: 1 }, signal)
  return response.meta?.total ?? response.data.length
}

export const fetchProduct = (slug: string, signal?: AbortSignal) =>
  api<ApiItem<ProductDetail>>(`/products/${slug}`, { signal })
