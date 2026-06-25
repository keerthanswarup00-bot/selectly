import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/80 dark:bg-secondary/80 px-4 py-1.5 text-xs text-muted-foreground mb-8 animate-fade-in">
              Built for professional photographers
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] animate-fade-in-up">
              Client galleries made beautifully simple.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              Share galleries, collect image selections, receive feedback, and keep every project
              organised in one elegant workspace built for photographers.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-slate-600 px-8 py-3.5 text-base font-medium text-white hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
              >
                Start Free
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-lg border border-border/80 bg-background px-8 py-3.5 text-base font-medium text-foreground hover:bg-secondary transition-all duration-200 w-full sm:w-auto"
              >
                Live Demo
              </Link>
            </div>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
            <div className="relative rounded-xl border border-border/60 bg-white dark:bg-card shadow-xl shadow-black/5 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 bg-[#fcfcfa] dark:bg-secondary/50">
                <span className="w-3 h-3 rounded-full bg-red-400/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <span className="w-3 h-3 rounded-full bg-green-400/80" />
                <span className="ml-3 text-xs text-muted-foreground">selixo.app &mdash; Wedding Gallery</span>
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Gallery</span>
                    <h3 className="text-lg font-semibold text-foreground">Smith &mdash; Johnson Wedding</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      124 selected
                    </span>
                    <span className="text-border">/</span>
                    <span>342 photos</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {Array.from({ length: 18 }).map((_, i) => {
                    const hues = ["168", "40", "220", "0"]
                    const hue = hues[i % hues.length]
                    return (
                      <div
                        key={i}
                        className="aspect-[3/4] rounded-md relative overflow-hidden"
                        style={{ backgroundColor: `hsl(${hue}, 15%, ${80 - (i % 4) * 8}%)` }}
                      >
                        {i < 4 && (
                          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500/80 border-2 border-white" />
                        )}
                        {i >= 8 && i < 12 && (
                          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white border border-amber-400/80" />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Selected
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Maybe
                  </span>
                  <span className="inline-flex items-center gap-1 border-l border-border/50 pl-3">
                    3 comments
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
