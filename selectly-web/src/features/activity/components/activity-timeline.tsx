"use client"

import { Clock, Upload, Link as LinkIcon, Eye, CheckCircle, FileText } from "lucide-react"
import { formatDateTime, timeAgo } from "@/lib/utils/date"
import { Skeleton } from "@/components/ui/skeleton"

export interface ActivityItem {
  id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface ActivityTimelineProps {
  activities?: ActivityItem[]
  isLoading: boolean
}

const actionIcons: Record<string, React.ReactNode> = {
  "project.created": <FileText className="h-4 w-4" />,
  "upload.completed": <Upload className="h-4 w-4" />,
  "project.shared": <LinkIcon className="h-4 w-4" />,
  "client.opened": <Eye className="h-4 w-4" />,
  "client.submitted": <CheckCircle className="h-4 w-4" />,
  "upload.started": <Upload className="h-4 w-4" />,
}

const actionLabels: Record<string, string> = {
  "project.created": "Project created",
  "upload.completed": "Upload completed",
  "project.shared": "Project shared with client",
  "client.opened": "Client opened gallery",
  "client.submitted": "Selections submitted",
  "upload.started": "Upload started",
}

export function ActivityTimeline({ activities, isLoading }: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-4 top-0 h-full w-px bg-border" aria-hidden="true" />
      {activities.map((activity) => (
        <div key={activity.id} className="relative flex gap-4 pb-6">
          <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-background">
            {actionIcons[activity.action] ?? <Clock className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="flex-1 pt-1">
            <p className="text-sm font-medium">
              {actionLabels[activity.action] ?? activity.action}
            </p>
            <p className="text-xs text-muted-foreground" title={formatDateTime(activity.created_at)}>
              {timeAgo(activity.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
