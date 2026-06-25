import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "./dashboard-shell"
import { ErrorBoundary } from "@/components/shared/error-boundary"

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("studio_id, full_name")
    .eq("id", user.id)
    .single<{ studio_id: string; full_name: string | null }>()

  if (!profile) {
    redirect("/login?reason=profile-not-found")
  }

  const { data: studio } = await supabase
    .from("studios")
    .select("name")
    .eq("id", profile.studio_id)
    .single<{ name: string }>()

  return (
    <DashboardShell
      studioId={profile.studio_id}
      studioName={studio?.name ?? "Studio"}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </DashboardShell>
  )
}
