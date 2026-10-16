import { useLocation } from 'react-router-dom'
import { Catalog } from '../products/catalog'
import { Hero } from './hero'

export function HomePage() {
  const { pathname } = useLocation()

  return (
    <>
      {pathname === '/' ? <Hero /> : null}
      <Catalog />
    </>
  )
}
