import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HomePage() {
  try {
    const supabase = await createServerClient()
    const { data: auth } = await supabase.auth.getUser()

    if (auth?.user) {
      redirect("/dashboard")
    }
  } catch {
    // If Supabase is unavailable (e.g., missing env vars), show landing page
  }

  redirect("/login")
}
