"use client"

import { Button } from "@/components/ui/button"

interface UploadSummaryProps {
  stats: {
    total: number
    success: number
    failed: number
  }
  hasCompleted: boolean
  onClear: () => void
  onRetryFailed: () => void
}

export function UploadSummary({ stats, hasCompleted, onClear, onRetryFailed }: UploadSummaryProps) {
  if (!hasCompleted && stats.failed === 0) return null

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">
          {stats.success} image{stats.success !== 1 ? "s" : ""} uploaded
        </p>
        {stats.failed > 0 && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {stats.failed} upload{stats.failed !== 1 ? "s" : ""} failed
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {stats.failed > 0 && (
          <Button variant="outline" size="sm" onClick={onRetryFailed}>
            Retry failed
          </Button>
        )}
        {stats.success > 0 && (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear completed
          </Button>
        )}
      </div>
    </div>
  )
}
