const steps = [
  {
    number: "01",
    title: "Upload",
    description: "Create a project and upload your images.",
    illustration: (
      <svg viewBox="0 0 120 100" className="w-full h-full" fill="none">
        <rect x="10" y="20" width="100" height="60" rx="6" className="stroke-[#315A55] dark:stroke-[#5f8f86] stroke-[1.5]" fill="currentColor" fillOpacity="0.05" />
        <rect x="25" y="30" width="18" height="22" rx="2" className="fill-[#cdba9a]/60" />
        <rect x="47" y="30" width="18" height="22" rx="2" className="fill-[#cdba9a]/60" />
        <rect x="69" y="30" width="18" height="22" rx="2" className="fill-[#cdba9a]/60" />
        <rect x="25" y="56" width="70" height="4" rx="2" className="fill-[#315A55]/20 dark:fill-[#315A55]/40" />
        <rect x="25" y="63" width="40" height="3" rx="1.5" className="fill-[#315A55]/10 dark:fill-[#315A55]/30" />
        <path d="M57 36 L57 44 M53 40 L61 40" className="stroke-[#315A55] dark:stroke-[#5f8f86] stroke-[1.5]" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Share",
    description: "Send one secure private gallery to your client.",
    illustration: (
      <svg viewBox="0 0 120 100" className="w-full h-full" fill="none">
        <rect x="10" y="20" width="100" height="60" rx="6" className="stroke-[#315A55] dark:stroke-[#5f8f86] stroke-[1.5]" fill="currentColor" fillOpacity="0.05" />
        <circle cx="60" cy="48" r="14" className="stroke-[#315A55] dark:stroke-[#5f8f86] stroke-[1.5]" fill="currentColor" fillOpacity="0.05" />
        <path d="M60 38 L60 48 L67 55" className="stroke-[#315A55] dark:stroke-[#5f8f86] stroke-[1.5]" strokeLinecap="round" />
        <path d="M35 75 L45 65" className="stroke-[#cdba9a] stroke-[1.5]" strokeLinecap="round" />
        <path d="M85 75 L75 65" className="stroke-[#cdba9a] stroke-[1.5]" strokeLinecap="round" />
        <rect x="45" y="78" width="30" height="4" rx="2" className="fill-[#315A55]/20 dark:fill-[#315A55]/40" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Approve",
    description: "Receive selections and comments instantly.",
    illustration: (
      <svg viewBox="0 0 120 100" className="w-full h-full" fill="none">
        <rect x="10" y="20" width="100" height="60" rx="6" className="stroke-[#315A55] dark:stroke-[#5f8f86] stroke-[1.5]" fill="currentColor" fillOpacity="0.05" />
        <rect x="25" y="32" width="12" height="16" rx="2" className="fill-[#3E7C59]/40" />
        <rect x="41" y="32" width="12" height="16" rx="2" className="fill-[#3E7C59]/40" />
        <rect x="57" y="32" width="12" height="16" rx="2" className="fill-[#cdba9a]/40" />
        <rect x="73" y="32" width="12" height="16" rx="2" className="fill-[#cdba9a]/40" />
        <path d="M25 58 L31 64 L37 58" className="stroke-[#3E7C59] stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="25" y="68" width="70" height="3" rx="1.5" className="fill-[#3E7C59]/30" />
        <rect x="25" y="68" width="50" height="3" rx="1.5" className="fill-[#3E7C59]" />
      </svg>
    ),
  },
]

export function HowItWorksSection() {
  return (
    <section id="workflow" className="py-20 md:py-28">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
            Workflow
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            A simpler way to deliver every gallery.
          </h2>
          <p className="mt-4 text-muted-foreground">
            From upload to approval in minutes. No training required.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-32 h-28 mx-auto mb-6 text-slate-600 dark:text-slate-400">
                {step.illustration}
              </div>
              <span className="text-xs font-medium text-muted-foreground">{step.number}</span>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
