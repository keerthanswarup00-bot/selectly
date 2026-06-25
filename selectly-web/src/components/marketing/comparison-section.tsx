export function ComparisonSection() {
  return (
    <section className="py-20 md:py-28 bg-surface/50 dark:bg-secondary/20">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
            Comparison
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Old workflow vs. Selixo
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          <div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-6">Old workflow</h3>
            <ul className="space-y-4">
              {[
                "Email chains",
                "WhatsApp messages",
                "Phone calls",
                "Manual tracking",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-red-500" viewBox="0 0 12 12" fill="none">
                      <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-6">
              Selixo
            </h3>
            <ul className="space-y-4">
              {[
                "One gallery",
                "One secure link",
                "Live progress",
                "One organised workspace",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-green-600" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
