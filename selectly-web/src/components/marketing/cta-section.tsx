import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Deliver a better gallery experience.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Create your first gallery in minutes and give every client a smoother way to review and
            select their favourite images.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-slate-600 px-8 py-3.5 text-base font-medium text-white hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
            >
              Start Free
            </Link>
            <Link
              href="/#features"
              className="inline-flex items-center justify-center rounded-lg border border-border/80 bg-background px-8 py-3.5 text-base font-medium text-foreground hover:bg-secondary transition-all duration-200 w-full sm:w-auto"
            >
              View Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
