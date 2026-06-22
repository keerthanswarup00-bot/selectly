"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge"
import { formatDate } from "@/lib/utils/date"
import type { Tables } from "@/types/database"

type Project = Tables["projects"]["Row"]

interface RecentProjectsProps {
  projects: Project[]
  isLoading: boolean
}

export function RecentProjects({ projects, isLoading }: RecentProjectsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Projects</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No projects yet.
          </p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/project/${project.id}`}
                className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {project.client_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(project.created_at)}
                  </p>
                </div>
                <ProjectStatusBadge status={project.status} />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
