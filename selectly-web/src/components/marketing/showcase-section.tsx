export function ShowcaseSection() {
  const devices = [
    {
      name: "Dashboard",
      mockup: (
        <div className="rounded-xl border border-border/60 bg-white dark:bg-card shadow-lg overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/50 bg-[#fcfcfa] dark:bg-secondary/50">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-8 w-8 rounded-full bg-muted" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[60, 45, 75, 50, 80, 55].map((h, i) => (
                <div key={i} className="rounded-lg p-3 border border-border/50 bg-[#fcfcfa] dark:bg-secondary/30">
                  <div className="h-2 w-16 rounded bg-muted mb-2" />
                  <div className="h-2 w-10 rounded bg-muted" />
                  <div className={`mt-3 h-1 w-${h > 60 ? "3/4" : "1/2"} rounded bg-green-500/30`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Gallery",
      mockup: (
        <div className="rounded-xl border border-border/60 bg-white dark:bg-card shadow-lg overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/50 bg-[#fcfcfa] dark:bg-secondary/50">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="p-5">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded bg-[#cdba9a]/20" />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Mobile",
      mockup: (
        <div className="rounded-2xl border border-border/60 bg-white dark:bg-card shadow-lg overflow-hidden max-w-[200px] mx-auto">
          <div className="flex items-center justify-center gap-1.5 px-3 py-2 border-b border-border/50 bg-[#fcfcfa] dark:bg-secondary/50">
            <span className="text-[10px] text-muted-foreground">Gallery</span>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded bg-[#cdba9a]/20" />
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-surface/50 dark:bg-secondary/20">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
            Preview
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            See it in action
          </h2>
          <p className="mt-4 text-muted-foreground">
            Clean interface. Thoughtful design. Built for photographers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {devices.map((device) => (
            <div key={device.name}>
              <p className="text-xs text-muted-foreground text-center mb-4">{device.name}</p>
              {device.mockup}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
