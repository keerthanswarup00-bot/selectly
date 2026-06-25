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
  const pathname = url.pathname

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password")
  const isAppPage = pathname.startsWith("/app")
  const isPublicPage = pathname.startsWith("/share/")

  // Redirect legacy /dashboard/* and /select/* routes
  if (pathname.startsWith("/dashboard")) {
    const newPath = pathname.replace(/^\/dashboard/, "/app")
    return NextResponse.redirect(new URL(newPath, request.url))
  }
  if (pathname.startsWith("/select/")) {
    const newPath = pathname.replace(/^\/select/, "/share")
    return NextResponse.redirect(new URL(newPath, request.url))
  }

  if (isPublicPage) {
    return supabaseResponse
  }

  if (isAppPage && !user) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPage && user && !url.searchParams.get("reason")) {
    return NextResponse.redirect(new URL("/app", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
