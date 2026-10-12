import { useState } from 'react'
import { SiteFooter } from '../../components/layout/site-footer'
import { SiteHeader } from '../../components/layout/site-header'
import { Catalog } from '../products/catalog'

export function HomePage() {
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  return (
    <div id="top" className="flex min-h-screen flex-col bg-ink font-sans text-neutral-200">
      <SiteHeader
        category={category}
        search={search}
        onSearch={setSearch}
        onSelectCategory={setCategory}
      />
      <main className="flex-1">
        <Catalog category={category} search={search} onSelectCategory={setCategory} />
      </main>
      <SiteFooter />
    </div>
  )
}
