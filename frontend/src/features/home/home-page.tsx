import { FloatingNavbar } from '../../components/ui/floating-navbar'
import { BentoGrid } from './bento-grid'
import { Hero } from './hero'
import { BrandStrip, Faq, FinalCta, Footer, HowItWorks, Reviews, Stats, VendorBanner } from './sections'

export function HomePage() {
  return (
    <div className="min-h-screen bg-ink font-sans text-neutral-200">
      <FloatingNavbar />
      <main>
        <Hero />
        <BrandStrip />
        <Stats />
        <BentoGrid />
        <HowItWorks />
        <VendorBanner />
        <Reviews />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
