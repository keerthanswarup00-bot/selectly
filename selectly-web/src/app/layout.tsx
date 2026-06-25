import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Providers } from "@/providers/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/shared/error-boundary"

export const metadata: Metadata = {
  title: {
    default: "Selixo — Client Galleries for Professional Photographers",
    template: "%s | Selixo",
  },
  description:
    "Share galleries, collect image selections, receive feedback, and keep every project organised in one elegant workspace built for photographers.",
  keywords: [
    "photography gallery",
    "client selection",
    "wedding photography",
    "photo approval",
    "photography studio software",
  ],
  openGraph: {
    title: "Selixo — Client Galleries for Professional Photographers",
    description:
      "Share galleries, collect image selections, receive feedback, and keep every project organised in one elegant workspace.",
    url: "https://selixo.app",
    siteName: "Selixo",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Selixo — Client Galleries for Professional Photographers",
    description:
      "Share galleries, collect image selections, receive feedback, and keep every project organised in one elegant workspace.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://selixo.app"),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <QueryProvider>
            <Providers>
              {children}
              <Toaster />
            </Providers>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
