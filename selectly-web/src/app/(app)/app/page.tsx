"use client"

import { useProjects } from "@/features/projects/hooks/use-projects"
import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard"
import { StatsCards } from "@/features/dashboard/components/stats-cards"
import { PageLoading } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { FolderPlus, AlertCircle, Folder, ChevronRight } from "lucide-react"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { Card } from "@/components/ui/card"
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge"
import { formatDate } from "@/lib/utils/date"
import type { Database } from "@/types/database"

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"]

export default function DashboardPage() {
  const [studioId, setStudioId] = useState<string | undefined>()
  const [loadError, setLoadError] = useState<string | null>(null)
  const { data, isLoading: statsLoading } = useDashboardStats(studioId)
  const { data: projects, isLoading: projectsLoading } = useProjects(studioId)

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
          .maybeSingle<{ studio_id: string }>()
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

  if (statsLoading || projectsLoading) return <PageLoading />

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Overview of your studio&apos;s projects
            </p>
          </div>
          <Link
            href="/app/new-project"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <FolderPlus className="h-4 w-4" />
            New Project
          </Link>
        </div>

        {data && <StatsCards stats={data.stats} />}

        {!projects || projects.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={<Folder className="h-12 w-12" />}
              title="No Projects Yet"
              description="Create your first project to begin sharing galleries with clients."
              action={{ label: "Create Project", href: "/app/new-project" }}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Projects</h2>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

function ProjectCard({ project }: { project: ProjectRow }) {
  return (
    <Link href={`/app/project/${project.id}`}>
      <Card className="p-4 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="rounded-lg bg-primary/10 p-2.5 mt-0.5 shrink-0">
              <Folder className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{project.client_name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                {project.event_date && <span>{formatDate(project.event_date)}</span>}
                <span>{project.total_images} images</span>
                {project.created_at && <span>Created {formatDate(project.created_at)}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ProjectStatusBadge status={project.status as ProjectRow["status"]} />
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </Card>
    </Link>
  )
}
