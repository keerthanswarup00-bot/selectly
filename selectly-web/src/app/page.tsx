import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HomePage() {
  let user = null

  try {
    const supabase = await createServerClient()
    const { data: auth } = await supabase.auth.getUser()
    user = auth?.user ?? null
  } catch {
    // If Supabase is unavailable (e.g., missing env vars), skip auth
  }

  if (user) {
    redirect("/dashboard")
  }

  redirect("/login")
}
