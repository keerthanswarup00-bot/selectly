import { createServerClient_ } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "./dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient_()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("studio_id, full_name")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  const { data: studio } = await supabase
    .from("studios")
    .select("name")
    .eq("id", profile.studio_id)
    .single()

  return (
    <DashboardShell
      studioId={profile.studio_id}
      studioName={studio?.name ?? "Studio"}
    >
      {children}
    </DashboardShell>
  )
}
