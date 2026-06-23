"use client"

import { CheckCircle, Circle, Loader2, XCircle, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { UploadFileItem } from "@/features/upload/hooks/use-upload-queue"

interface FileListProps {
  items: UploadFileItem[]
}

const statusIcon = {
  pending: Circle,
  compressing: Loader2,
  uploading: Loader2,
  success: CheckCircle,
  failed: XCircle,
}

const statusStyles = {
  pending: "text-muted-foreground",
  compressing: "text-primary",
  uploading: "text-primary",
  success: "text-green-600 dark:text-green-400",
  failed: "text-red-600 dark:text-red-400",
}

export function FileList({ items }: FileListProps) {
  if (items.length === 0) return null

  return (
    <div className="max-h-60 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const Icon = statusIcon[item.status]
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                item.status === "compressing" || item.status === "uploading" ? "animate-spin" : "",
                statusStyles[item.status],
              )}
            />
            <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{item.filename}</span>

            {(item.status === "uploading" || item.status === "compressing") && (
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}

            {item.status === "failed" && item.error && (
              <span className="max-w-[200px] truncate text-xs text-red-600 dark:text-red-400" title={item.error}>
                {item.error}
              </span>
            )}

            {item.status === "success" && (
              <span className="text-xs text-green-600 dark:text-green-400">Done</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
