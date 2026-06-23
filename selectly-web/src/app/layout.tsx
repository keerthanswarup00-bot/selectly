import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/providers/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/shared/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Selectly",
    template: "%s | Selectly",
  },
  description: "Wedding photo selection platform for studios",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
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
