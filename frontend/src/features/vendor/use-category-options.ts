import { useAsync } from '../../hooks/use-async'
import { fetchCategories } from '../products/api'
import type { Category } from '../../types/api'

export type CategoryOption = { id: number; label: string }

function flatten(categories: Category[], depth = 0): CategoryOption[] {
  return categories.flatMap((category) => [
    { id: category.id, label: `${'— '.repeat(depth)}${category.name}` },
    ...flatten(category.children ?? [], depth + 1),
  ])
}

/** دسته‌بندی‌ها درختی برمی‌گردند؛ برای <select> به فهرست تخت نیاز داریم. */
export function useCategoryOptions() {
  const response = useAsync((signal) => fetchCategories(signal), 'categories')

  return {
    options: flatten(response.data?.data ?? []),
    loading: response.loading,
    error: response.error,
    retry: response.retry,
  }
}
