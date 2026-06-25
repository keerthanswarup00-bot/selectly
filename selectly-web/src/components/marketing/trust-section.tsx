const cards = [
  {
    title: "Private Sharing",
    description: "Secure galleries with password protection and expiring links.",
  },
  {
    title: "Fast Client Reviews",
    description: "Clients can review and select photos instantly on any device.",
  },
  {
    title: "Studio Branding",
    description: "Customise galleries with your logo, colours, and domain.",
  },
  {
    title: "Mobile Friendly",
    description: "Every gallery works perfectly on phones, tablets, and desktops.",
  },
]

export function TrustSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-border/50 bg-white dark:bg-card p-6 hover:shadow-md hover:shadow-black/[0.03] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900/30 flex items-center justify-center mb-4">
                <div className="w-5 h-5 rounded-full border-2 border-slate-600 dark:border-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
