import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge"
import { formatDate, formatEventDate } from "@/lib/utils/date"
import type { Database } from "@/types/database"

type Project = Database["public"]["Tables"]["projects"]["Row"]

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/app/project/${project.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{project.client_name}</CardTitle>
            <ProjectStatusBadge status={project.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Event:{" "}
              {project.event_date ? formatEventDate(project.event_date) : "Not set"}
            </p>
            <p>
              Target: {project.target_count} ({project.min_count}–{project.max_count})
            </p>
            <p>Images: {project.total_images}</p>
            <p>Created: {formatDate(project.created_at)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
