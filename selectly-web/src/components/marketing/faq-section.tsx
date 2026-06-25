"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    q: "Do clients need an account?",
    a: "No. Clients access galleries through a secure link. No sign-up, no password to remember, no app to install.",
  },
  {
    q: "Can clients comment on photos?",
    a: "Yes. Clients can leave comments on individual photos, reply to threads, and send messages through the gallery. You receive notifications in real time.",
  },
  {
    q: "Can I customise branding?",
    a: "Pro and Studio plans include full branding customisation. Add your logo, choose brand colours, and use a custom domain for your galleries.",
  },
  {
    q: "How secure are galleries?",
    a: "All galleries are password-protected and served over HTTPS. Links can be set to expire, and you control exactly who has access.",
  },
  {
    q: "What file formats are supported?",
    a: "Selixo accepts JPEG, PNG, TIFF, and WebP. For RAW files, we recommend converting to high-quality JPEGs before uploading.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The Free plan includes up to 3 projects with 100 photos each. Upgrade to Pro or Studio for unlimited projects and photos.",
  },
]

export function FAQSection({ featured }: { featured?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id={featured ? "faq" : undefined} className="py-20 md:py-28 bg-surface/50 dark:bg-secondary/20">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Frequently asked questions
          </h2>
        </div>
        <div className="max-w-[680px] mx-auto divide-y divide-border/50">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="py-5">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex items-center justify-between w-full text-left group"
                aria-expanded={openIndex === i}
              >
                <span className="text-sm font-medium text-foreground group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-48 mt-3" : "max-h-0"
                }`}
              >
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
