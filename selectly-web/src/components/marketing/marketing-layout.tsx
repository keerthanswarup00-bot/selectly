import { MarketingNav } from "./marketing-nav"
import { MarketingFooter } from "./marketing-footer"

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main className="min-h-screen">{children}</main>
      <MarketingFooter />
    </>
  )
}
