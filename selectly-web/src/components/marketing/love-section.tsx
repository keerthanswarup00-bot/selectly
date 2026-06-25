const reasons = [
  "Designed for photographers",
  "Simple for every client",
  "Fast gallery delivery",
  "No unnecessary complexity",
  "Professional presentation",
  "Works beautifully on every device",
]

export function LoveSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Why photographers choose Selixo
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reasons.map((reason) => (
            <div
              key={reason}
              className="rounded-xl border border-border/50 bg-white dark:bg-card p-6 hover:shadow-md hover:shadow-black/[0.03] transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900/30 flex items-center justify-center mb-4">
                <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8 L6 11 L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">{reason}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
