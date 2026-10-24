import { api } from '../../lib/api/client'
import type { ApiItem, ApiList, Category, Product, ProductDetail, SearchSuggestions } from '../../types/api'

export const fetchCategories = (signal?: AbortSignal) => api<ApiList<Category>>('/categories', { signal })

export type ProductQuery = {
  category?: string
  brand?: string
  vendor?: string
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

export const fetchSuggestions = (term: string, signal?: AbortSignal) =>
  api<{ data: SearchSuggestions }>('/products/suggest', { query: { q: term }, signal })

export const fetchRecommendations = (slug: string, signal?: AbortSignal) =>
  api<ApiList<Product>>(`/products/${slug}/recommendations`, { signal })

export const fetchPopular = (signal?: AbortSignal) => api<ApiList<Product>>('/products/popular', { signal })
