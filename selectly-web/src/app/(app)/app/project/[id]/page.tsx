"use client"

import { use } from "react"
import Link from "next/link"
import { useProject } from "@/features/projects/hooks/use-projects"
import { FolderGrid } from "@/features/projects/components/folder-grid"
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge"
import { PageLoading } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import { ErrorBoundary } from "@/components/shared/error-boundary"

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: project, isLoading } = useProject(id)

  if (isLoading) return <PageLoading />

  if (!project) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-12 w-12" />}
        title="Project Not Found"
        description="This project doesn't exist or has been deleted."
        action={{ label: "Back to Dashboard", href: "/app" }}
      />
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/app" className="hover:text-foreground transition-colors">Dashboard</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{project.client_name}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{project.client_name}</h1>
            {project.event_date && (
              <p className="text-sm text-muted-foreground">{formatDate(project.event_date)}</p>
            )}
            {project.notes && (
              <p className="text-sm text-muted-foreground mt-1">{project.notes}</p>
            )}
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        <FolderGrid projectId={id} />
      </div>
    </ErrorBoundary>
  )
}
