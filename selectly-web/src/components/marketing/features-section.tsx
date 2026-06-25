import { Check } from "lucide-react"

const features = [
  {
    eyebrow: "Galleries",
    title: "Private Galleries",
    description:
      "Each project gets its own private gallery with a secure link. Clients see exactly what they need to see, nothing more.",
    bullets: ["Password-protected sharing", "Expiring links", "Branded gallery pages"],
    image: "left",
  },
  {
    eyebrow: "Feedback",
    title: "Comments & Feedback",
    description:
      "Clients can leave comments on individual photos. Ask questions, request edits, or give final approval without leaving the gallery.",
    bullets: ["Per-photo comments", "Threaded replies", "Email notifications"],
    image: "right",
  },
  {
    eyebrow: "Selections",
    title: "Selection Tracking",
    description:
      "Clients can mark favourites, flag maybes, and reject photos with a single click. You see exactly what they choose in real time.",
    bullets: ["Favourite / Maybe / Reject", "Real-time sync", "Bulk selection mode"],
    image: "left",
  },
  {
    eyebrow: "Progress",
    title: "Progress Status",
    description:
      "See at a glance how far each client has progressed. Know who has finished and who needs a gentle reminder.",
    bullets: ["Per-client progress", "Automatic reminders", "Completion dashboard"],
    image: "right",
  },
  {
    eyebrow: "Branding",
    title: "Studio Branding",
    description:
      "Customise galleries with your logo, brand colours, and domain. Every client touchpoint reinforces your studio identity.",
    bullets: ["Custom logo and colours", "Custom domain", "Consistent brand experience"],
    image: "left",
  },
  {
    eyebrow: "Delivery",
    title: "Fast Image Delivery",
    description:
      "Deliver full-resolution previews that load fast anywhere in the world. Optimised for speed without sacrificing quality.",
    bullets: ["Optimised delivery", "Zoom and pan", "Global CDN"],
    image: "right",
  },
]

function FeatureMockup({ side }: { side: string }) {
  return (
    <div className="relative rounded-xl border border-border/60 bg-white dark:bg-card shadow-lg shadow-black/[0.03] overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/50 bg-[#fcfcfa] dark:bg-secondary/50">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="aspect-[3/4] rounded bg-[#cdba9a]/30" />
          <div className="aspect-[3/4] rounded bg-[#cdba9a]/30 relative">
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500/70 border-2 border-white" />
          </div>
          <div className="aspect-[3/4] rounded bg-[#cdba9a]/30" />
        </div>
        {side === "right" && (
          <div className="space-y-2">
            <div className="h-2 w-full rounded bg-muted" />
            <div className="h-2 w-3/4 rounded bg-green-500/20" />
          </div>
        )}
        {side === "left" && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-3/4 rounded bg-muted" />
              <div className="h-2 w-1/2 rounded bg-muted" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-20">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
            Features
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Everything you need to manage client selections
          </h2>
          <p className="mt-4 text-muted-foreground">
            No spreadsheets. No scattered messages. No confusion.
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
            >
              {feature.image === "left" ? (
                <>
                  <FeatureContent feature={feature} />
                  <FeatureMockup side="left" />
                </>
              ) : (
                <>
                  <FeatureMockup side="right" />
                  <FeatureContent feature={feature} />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureContent({ feature }: { feature: (typeof features)[number] }) {
  return (
    <div>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
        {feature.eyebrow}
      </span>
      <h3 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
        {feature.title}
      </h3>
      <p
        className="mt-4 text-muted-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: feature.description }}
      />
      <ul className="mt-6 space-y-3">
        {feature.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-3 text-sm text-foreground">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-900/30 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-slate-600 dark:text-slate-400" />
            </span>
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  )
}
