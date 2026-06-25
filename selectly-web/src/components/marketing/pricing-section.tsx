import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for trying out Selixo.",
    features: [
      "Up to 3 projects",
      "100 photos per project",
      "Basic galleries",
      "Standard support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For professional photographers.",
    features: [
      "Unlimited projects",
      "Unlimited photos",
      "Branded galleries",
      "Priority support",
      "Comment threads",
      "Progress tracking",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Studio",
    price: "$49",
    period: "/month",
    description: "For growing studios and teams.",
    features: [
      "Everything in Pro",
      "Team member access",
      "Custom domain",
      "API access",
      "Advanced analytics",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
]

export function PricingSection({ featured }: { featured?: boolean }) {
  return (
    <section id={featured ? "pricing" : undefined} className="py-20 md:py-28">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            No hidden fees. No surprises. Start free and upgrade when you need more.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border ${
                plan.highlighted
                  ? "border-slate-600 dark:border-slate-400 shadow-lg shadow-slate-600/5"
                  : "border-border/50"
              } bg-white dark:bg-card p-8 flex flex-col`}
            >
              {plan.highlighted && (
                <span className="inline-flex self-start items-center rounded-full bg-slate-50 dark:bg-slate-900/30 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 mb-4">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                    <svg
                      className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M4 8L7 11L12 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.highlighted ? "/signup" : plan.name === "Studio" ? "/#contact" : "/signup"}
                className={`mt-8 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 ${
                  plan.highlighted
                    ? "bg-slate-600 text-white hover:bg-slate-700 shadow-sm"
                    : "border border-border/80 bg-background text-foreground hover:bg-secondary"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
