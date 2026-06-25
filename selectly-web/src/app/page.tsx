import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { HeroSection } from "@/components/marketing/hero-section"
import { TrustSection } from "@/components/marketing/trust-section"
import { HowItWorksSection } from "@/components/marketing/how-it-works-section"
import { FeaturesSection } from "@/components/marketing/features-section"
import { ShowcaseSection } from "@/components/marketing/showcase-section"
import { LoveSection } from "@/components/marketing/love-section"
import { ComparisonSection } from "@/components/marketing/comparison-section"
import { TestimonialsSection } from "@/components/marketing/testimonials-section"
import { PricingSection } from "@/components/marketing/pricing-section"
import { FAQSection } from "@/components/marketing/faq-section"
import { CTASection } from "@/components/marketing/cta-section"

export default function HomePage() {
  return (
    <MarketingLayout>
      <HeroSection />
      <TrustSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ShowcaseSection />
      <LoveSection />
      <ComparisonSection />
      <TestimonialsSection />
      <PricingSection featured />
      <FAQSection featured />
      <CTASection />
    </MarketingLayout>
  )
}
