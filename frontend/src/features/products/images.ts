export const sampleImageSources = (id: number) => [`/products/${id}.jpg`]

export const categoryImageSources = (category: string) =>
  category ? [`/categories/${category}.jpg`] : []
