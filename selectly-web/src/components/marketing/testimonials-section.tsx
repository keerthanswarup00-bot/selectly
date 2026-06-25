export function TestimonialsSection() {
  const testimonials = [
    {
      initials: "SK",
      name: "Sarah Kim",
      studio: "Kim Studio",
      quote:
        "Our clients love how easy it is to use. We used to spend days chasing selections. Now it happens in hours.",
    },
    {
      initials: "MJ",
      name: "Marcus Johnson",
      studio: "MJ Photography",
      quote:
        "The gallery design alone has impressed several clients. It makes us look more professional.",
    },
    {
      initials: "AL",
      name: "Alex Liu",
      studio: "Liu Weddings",
      quote:
        "I was skeptical about yet another tool, but this actually replaced three separate workflows for us.",
    },
  ]

  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
            Testimonials
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Trusted by photographers
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-border/50 bg-white dark:bg-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#cdba9a]/40 flex items-center justify-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.studio}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
