import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: auth } = await supabase.auth.getUser()

  if (auth?.user) {
    redirect("/dashboard")
  }

  redirect("/login")
}
