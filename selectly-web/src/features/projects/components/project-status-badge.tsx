import { Badge } from "@/components/ui/badge"
import type { ProjectStatus } from "@/types/project"

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100" },
  uploading: { label: "Uploading", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" },
  uploaded:  { label: "Uploaded",  className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" },
  selecting: { label: "Selecting", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100" },
  submitted:{ label: "Submitted", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
  completed:{ label: "Completed", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
}

interface ProjectStatusBadgeProps {
  status: ProjectStatus
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge className={config.className} variant="outline">
      {config.label}
    </Badge>
  )
}
