import { type NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = new URL(request.url)
  const isAuthPage = url.pathname.startsWith("/login") || url.pathname.startsWith("/signup")
  const isDashboardPage = url.pathname.startsWith("/dashboard")
  const isPublicPage = url.pathname.startsWith("/select/")

  if (isPublicPage) {
    return response
  }

  if (isDashboardPage && !user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is being redirected to /login with a reason (e.g., profile deleted),
  // don't bounce them back to dashboard — breaks the infinite loop
  const reason = url.searchParams.get("reason")
  if (isAuthPage && user && !reason) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
