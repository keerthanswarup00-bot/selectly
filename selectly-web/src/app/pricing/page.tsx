import type { Metadata } from "next"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { PricingSection } from "@/components/marketing/pricing-section"
import { FAQSection } from "@/components/marketing/faq-section"
import { CTASection } from "@/components/marketing/cta-section"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for photographers. Start free and upgrade when you need more.",
}

export default function PricingPage() {
  return (
    <MarketingLayout>
      <div className="pt-32" />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </MarketingLayout>
  )
}
