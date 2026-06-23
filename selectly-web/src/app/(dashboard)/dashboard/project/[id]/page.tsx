"use client"

import { use, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useProject } from "@/features/projects/hooks/use-projects"
import { UploadZone } from "@/features/upload/components/upload-zone"
import { UploadProgress } from "@/features/upload/components/upload-progress"
import { FileList } from "@/features/upload/components/file-list"
import { UploadSummary } from "@/features/upload/components/upload-summary"
import { useUploadQueue } from "@/features/upload/hooks/use-upload-queue"
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoading } from "@/components/shared/loading-spinner"
import { Copy, Check } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import type { ProjectStatus } from "@/types/project"

const STATUS_VALUES: readonly ProjectStatus[] = ["draft", "uploading", "uploaded", "selecting", "submitted", "completed"]

function toProjectStatus(status: string): ProjectStatus {
  return STATUS_VALUES.includes(status as ProjectStatus) ? (status as ProjectStatus) : "draft"
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: project, isLoading, refetch } = useProject(id)
  const [studioId, setStudioId] = useState<string>()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("studio_id")
        .eq("id", user.id)
        .single<{ studio_id: string }>()
      if (profile) setStudioId(profile.studio_id)
    }
    loadProfile()
  }, [])

  const upload = useUploadQueue({
    studioId: studioId ?? "",
    projectId: id,
    onComplete: () => { refetch().catch(() => {}) },
  })

  async function handleFilesSelected(files: File[]) {
    const { accepted } = upload.addFiles(files)
    if (accepted > 0) {
      const supabase = createClient()
      await supabase
        .from("projects")
        .update({ status: "uploading" })
        .eq("id", id)
      refetch().catch(() => {})
      upload.processQueue().catch(() => {})
    }
  }

  const clientLink = project?.link_token
    ? `${window.location.origin}/select/${project.link_token}`
    : null

  async function copyLink() {
    if (!clientLink) return
    await navigator.clipboard.writeText(clientLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) return <PageLoading />
  if (!project) return <div>Project not found</div>

  const canUpload = project.status === "draft" || project.status === "uploading"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.client_name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.event_date && formatDate(project.event_date)}
          </p>
        </div>
        <ProjectStatusBadge status={toProjectStatus(project.status)} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Target</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project.target_count}</p>
            <p className="text-xs text-muted-foreground">
              Range: {project.min_count} &ndash; {project.max_count}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project.total_images}</p>
            <p className="text-xs text-muted-foreground">Uploaded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Client Link</CardTitle>
          </CardHeader>
          <CardContent>
            {clientLink ? (
              <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Not available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadZone
              onFilesSelected={handleFilesSelected}
              disabled={upload.isProcessing}
            />
            {upload.items.length > 0 && (
              <>
                <UploadProgress
                  progress={upload.totalProgress}
                  stats={upload.stats}
                  isProcessing={upload.isProcessing}
                />
                <FileList items={upload.items} />
                {!upload.isProcessing && upload.stats.failed + upload.stats.success === upload.stats.total && (
                  <UploadSummary
                    stats={upload.stats}
                    hasCompleted={upload.stats.success > 0}
                    onClear={upload.reset}
                    onRetryFailed={upload.retryFailed}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
