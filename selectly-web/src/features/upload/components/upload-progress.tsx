"use client"

import { cn } from "@/lib/utils/cn"

interface UploadProgressProps {
  progress: number
  stats: {
    total: number
    success: number
    failed: number
    processing: number
    pending: number
  }
  isProcessing: boolean
}

export function UploadProgress({ progress, stats, isProcessing: _isProcessing }: UploadProgressProps) {
  if (stats.total === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {stats.success + stats.failed} / {stats.total} files
        </span>
        <span className="font-medium">{progress}%</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            progress === 100 ? "bg-green-500" : "bg-primary",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        {stats.processing > 0 && <span>{stats.processing} uploading...</span>}
        {stats.success > 0 && <span className="text-green-600 dark:text-green-400">{stats.success} done</span>}
        {stats.failed > 0 && <span className="text-red-600 dark:text-red-400">{stats.failed} failed</span>}
        {stats.pending > 0 && <span>{stats.pending} queued</span>}
      </div>
    </div>
  )
}
