import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "./dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("studio_id, full_name")
    .eq("id", user.id)
    .maybeSingle<{ studio_id: string; full_name: string | null }>()

  if (!profile) {
    console.error("Profile not found for user", user.id, profileErr)
    redirect("/login?reason=profile-not-found")
  }

  const { data: studio } = await supabase
    .from("studios")
    .select("name")
    .eq("id", profile.studio_id)
    .maybeSingle<{ name: string }>()

  return (
    <DashboardShell
      studioId={profile.studio_id}
      studioName={studio?.name ?? "Studio"}
    >
      {children}
    </DashboardShell>
  )
}
