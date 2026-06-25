import type { Metadata } from "next"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Download, Apple, Monitor } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Download",
  description: "Download Selixo for Windows, macOS, or Linux.",
}

const platforms = [
  {
    name: "macOS",
    icon: Apple,
    description: "Native macOS application",
    size: "~45 MB",
    requirements: "macOS 13 Ventura or later, Apple Silicon or Intel",
    status: "coming soon",
  },
  {
    name: "Windows",
    icon: Monitor,
    description: "Native Windows application",
    size: "~42 MB",
    requirements: "Windows 10 or later, 64-bit",
    status: "coming soon",
  },
  {
    name: "Linux",
    icon: Download,
    description: "AppImage for Linux",
    size: "~48 MB",
    requirements: "Ubuntu 22.04+, Fedora 38+, or equivalent",
    status: "coming soon",
  },
]

export default function DownloadPage() {
  return (
    <MarketingLayout>
      <div className="pt-32 pb-20 md:pt-44 md:pb-28">
        <div className="container max-w-[1200px] mx-auto px-6">
          <div className="max-w-xl mx-auto text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Download Selixo
            </h1>
            <p className="mt-4 text-muted-foreground">
              Use Selixo as a native desktop application for a faster, more integrated experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="rounded-xl border border-border/50 bg-white dark:bg-card p-8 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/30 flex items-center justify-center mx-auto mb-5">
                  <platform.icon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{platform.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                <div className="text-xs text-muted-foreground space-y-1 mb-6">
                  <p>Size: {platform.size}</p>
                  <p>{platform.requirements}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {platform.status}
                </span>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto mt-20">
            <div className="rounded-xl border border-border/50 bg-white dark:bg-card p-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Release Notes</h2>
              <div className="text-sm text-muted-foreground space-y-3">
                <p className="font-medium text-foreground">Version 1.0.0 &mdash; Coming Soon</p>
                <ul className="space-y-2 list-disc pl-5">
                  <li>Native gallery viewing with smooth image zoom</li>
                  <li>Drag-and-drop folder upload support</li>
                  <li>Desktop notifications for client submissions</li>
                  <li>Offline image cache for faster loading</li>
                  <li>Keyboard shortcuts for faster navigation</li>
                  <li>Auto-update support</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              In the meantime, use Selixo in your browser.{" "}
              <Link href="/signup" className="text-slate-600 dark:text-slate-400 hover:underline">
                Get started free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  )
}
