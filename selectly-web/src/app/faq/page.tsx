import type { Metadata } from "next"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { FAQSection } from "@/components/marketing/faq-section"
import { CTASection } from "@/components/marketing/cta-section"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Selixo.",
}

export default function FAQPage() {
  return (
    <MarketingLayout>
      <div className="pt-32" />
      <FAQSection />
      <CTASection />
    </MarketingLayout>
  )
}
