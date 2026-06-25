"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useFolder, useFolderImages } from "@/features/folders/hooks/use-folders"
import { UploadZone } from "@/features/upload/components/upload-zone"
import { UploadProgress } from "@/features/upload/components/upload-progress"
import { FileList } from "@/features/upload/components/file-list"
import { UploadSummary } from "@/features/upload/components/upload-summary"
import { useUploadQueue } from "@/features/upload/hooks/use-upload-queue"
import { ShareFolderDialog } from "@/features/projects/components/share-folder-dialog"
import { Button } from "@/components/ui/button"
import { PageLoading } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { AlertCircle, ImagePlus, Globe, Lock } from "lucide-react"

export default function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string; folderId: string }>
}) {
  const { id: projectId, folderId } = use(params)
  const { data: folder, isLoading: folderLoading, refetch: refetchFolder } = useFolder(folderId)
  const { data: images, isLoading: imagesLoading, refetch: refetchImages } = useFolderImages(folderId)
  const [studioId, setStudioId] = useState<string>()
  const [showShare, setShowShare] = useState(false)

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
    projectId,
    folderId,
    onComplete: () => { refetchImages(); refetchFolder() },
  })

  async function handleFilesSelected(files: File[]) {
    const { accepted } = upload.addFiles(files)
    if (accepted > 0) {
      upload.processQueue()
    }
  }

  if (folderLoading || imagesLoading) return <PageLoading />

  if (!folder) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-12 w-12" />}
        title="Folder Not Found"
        description="This folder doesn't exist or has been deleted."
        action={{ label: "Back to Project", href: `/app/project/${projectId}` }}
      />
    )
  }

  const isUploading = folder.status === "draft" || folder.status === "uploading" || folder.status === "ready"

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/app" className="hover:text-foreground transition-colors">Dashboard</Link>
              <span>/</span>
              <Link href={`/app/project/${projectId}`} className="hover:text-foreground transition-colors">Project</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{folder.name}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{folder.name}</h1>
            {folder.description && (
              <p className="text-sm text-muted-foreground">{folder.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowShare(true)}>
              {folder.link_disabled ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              {folder.link_disabled ? "Share" : "Shared"}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="px-2 py-0.5 rounded-full bg-muted">
            {folder.selection_type === "no_limit" ? "No limit" :
             folder.selection_type === "minimum" ? `Min: ${folder.min_count}` :
             `${folder.min_count}–${folder.max_count}`}
          </span>
          <span>{folder.total_images} image{folder.total_images !== 1 ? "s" : ""}</span>
        </div>

        {isUploading && (
          <div className="space-y-4">
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
          </div>
        )}

        {images && images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {images.map((image) => (
              <div key={image.id} className="aspect-square rounded-xl overflow-hidden bg-muted border group relative">
                <img
                  src={image.preview_url || `/api/images/${image.storage_path}`}
                  alt={image.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{image.filename}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ImagePlus className="h-12 w-12" />}
            title="No Images Yet"
            description="Upload images to this folder to get started."
            className="min-h-[300px]"
          />
        )}
      </div>

      {showShare && (
        <ShareFolderDialog
          folderId={folderId}
          open={showShare}
          onOpenChange={setShowShare}
        />
      )}
    </ErrorBoundary>
  )
}
