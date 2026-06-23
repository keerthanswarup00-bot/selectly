import { type NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  let user = null

  try {
    const client = await createMiddlewareClient(request)
    supabaseResponse = client.response
    const { data } = await client.supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // If Supabase env vars are missing, skip auth
  }

  const url = new URL(request.url)
  const isAuthPage = url.pathname.startsWith("/login") || url.pathname.startsWith("/signup")
  const isDashboardPage = url.pathname.startsWith("/dashboard")
  const isPublicPage = url.pathname.startsWith("/select/")

  if (isPublicPage) {
    return supabaseResponse
  }

  if (isDashboardPage && !user) {
    const loginUrl = new URL("/login", request.url)
    // Attach a reason if the user exists but session might be bad
    return NextResponse.redirect(loginUrl)
  }

  const reason = url.searchParams.get("reason")
  if (isAuthPage && user && !reason) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
