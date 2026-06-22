"use client"

import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard"
import { StatsCards } from "@/features/dashboard/components/stats-cards"
import { RecentProjects } from "@/features/dashboard/components/recent-projects"
import { PageLoading } from "@/components/shared/loading-spinner"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function DashboardPage() {
  const [studioId, setStudioId] = useState<string | undefined>()
  const { data, isLoading } = useDashboardStats(studioId)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("studio_id")
        .eq("id", user.id)
        .single()
      if (profile) setStudioId(profile.studio_id)
    }
    load()
  }, [])

  if (isLoading) return <PageLoading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your studio&apos;s projects
        </p>
      </div>

      {data && <StatsCards stats={data.stats} />}
      {data && <RecentProjects projects={data.recentProjects} />}
    </div>
  )
}
