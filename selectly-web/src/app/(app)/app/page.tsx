"use client"

import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard"
import { StatsCards } from "@/features/dashboard/components/stats-cards"
import { RecentProjects } from "@/features/dashboard/components/recent-projects"
import { PageLoading } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"
import { FolderPlus, AlertCircle } from "lucide-react"
import { ErrorBoundary } from "@/components/shared/error-boundary"

export default function DashboardPage() {
  const [studioId, setStudioId] = useState<string | undefined>()
  const [loadError, setLoadError] = useState<string | null>(null)
  const { data, isLoading } = useDashboardStats(studioId)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          setLoadError("Unable to verify your session. Please try logging in again.")
          return
        }
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("studio_id")
          .eq("id", user.id)
          .single<{ studio_id: string }>()
        if (profileError || !profile) {
          setLoadError("Unable to load your profile. Please contact support.")
          return
        }
        setStudioId(profile.studio_id)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "An unexpected error occurred")
      }
    }
    load()
  }, [])

  if (loadError) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-12 w-12" />}
        title="Something went wrong"
        description={loadError}
      />
    )
  }

  if (isLoading) return <PageLoading />

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your studio&apos;s projects
          </p>
        </div>

        {data ? (
          <>
            <StatsCards stats={data.stats} />
            {data.recentProjects.length > 0 ? (
              <RecentProjects projects={data.recentProjects as Database["public"]["Tables"]["projects"]["Row"][]} isLoading={false} />
            ) : (
              <EmptyState
                icon={<FolderPlus className="h-12 w-12" />}
                title="No Projects Yet"
                description="Create your first project to begin sharing galleries with clients."
                action={{ label: "Create Project", href: "/app/new-project" }}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon={<FolderPlus className="h-12 w-12" />}
            title="Welcome to Selixo"
            description="Get started by creating your first project."
            action={{ label: "Create Project", href: "/app/new-project" }}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
