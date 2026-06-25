import Link from "next/link"

const footerLinks = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#workflow", label: "Workflow" },
      { href: "/pricing", label: "Pricing" },
      { href: "/download", label: "Download" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/#", label: "Guide" },
      { href: "/#", label: "API" },
      { href: "/#", label: "Status" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#", label: "Privacy" },
      { href: "/#", label: "Terms" },
      { href: "/#", label: "Contact" },
    ],
  },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/50 bg-surface dark:bg-secondary/80">
      <div className="container max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-slate-600 dark:text-slate-400"
            >
              Selixo
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Share galleries, collect image selections, receive feedback, and keep every project
              organised in one elegant workspace built for photographers.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-medium text-foreground mb-4">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Selixo. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Designed for photographers.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
