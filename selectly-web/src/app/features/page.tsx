import type { Metadata } from "next"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { FeaturesSection } from "@/components/marketing/features-section"
import { CTASection } from "@/components/marketing/cta-section"

export const metadata: Metadata = {
  title: "Features",
  description:
    "Private client galleries, selection tracking, comment threads, high-resolution previews, studio branding, and progress tracking.",
}

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <div className="pt-32" />
      <FeaturesSection />
      <CTASection />
    </MarketingLayout>
  )
}
