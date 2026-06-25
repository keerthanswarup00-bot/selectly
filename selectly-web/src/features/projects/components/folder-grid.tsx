import { FolderRow } from "@/types/database"
import { useFolders, useDeleteFolder, useToggleFolderShare } from "@/features/folders/hooks/use-folders"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { PageLoading } from "@/components/shared/loading-spinner"
import { Folder, FolderOpen, Plus, Share2, Lock, Globe, MoreHorizontal, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateFolderDialog } from "./create-folder-dialog"
import { ShareFolderDialog } from "./share-folder-dialog"

interface FolderGridProps {
  projectId: string
}

export function FolderGrid({ projectId }: FolderGridProps) {
  const { data: folders, isLoading } = useFolders(projectId)
  const [showCreate, setShowCreate] = useState(false)
  const [shareFolderId, setShareFolderId] = useState<string | null>(null)
  const deleteFolder = useDeleteFolder()
  const toggleShare = useToggleFolderShare()

  if (isLoading) return <PageLoading />

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Folders</h2>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Folder
        </Button>
      </div>

      {!folders || folders.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Folder className="h-12 w-12" />}
            title="No Folders Yet"
            description="Create a folder to organize images for this project."
            action={{ label: "Create Folder", onClick: () => setShowCreate(true) }}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onDelete={() => { if (confirm("Delete this folder?")) deleteFolder.mutate(folder.id) }}
              onShareToggle={() => toggleShare.mutate({ folderId: folder.id, enabled: folder.link_disabled })}
              onShareClick={() => setShareFolderId(folder.id)}
            />
          ))}
        </div>
      )}

      <CreateFolderDialog
        projectId={projectId}
        open={showCreate}
        onOpenChange={setShowCreate}
      />

      {shareFolderId && (
        <ShareFolderDialog
          folderId={shareFolderId}
          open={!!shareFolderId}
          onOpenChange={(open) => { if (!open) setShareFolderId(null) }}
        />
      )}
    </>
  )
}

function FolderCard({
  folder,
  onDelete,
  onShareToggle,
  onShareClick,
}: {
  folder: FolderRow
  onDelete: () => void
  onShareToggle: () => void
  onShareClick: () => void
}) {
  const label = folder.selection_type === "minimum" ? `Min: ${folder.min_count}`
    : folder.selection_type === "range" ? `${folder.min_count}–${folder.max_count}`
    : "No limit"

  return (
    <Link
      href={`/app/project/${folder.project_id}/folder/${folder.id}`}
      className="block group"
    >
      <Card className="p-4 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 mt-0.5">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{folder.name}</p>
              {folder.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{folder.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">
                {folder.total_images} image{folder.total_images !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); onShareClick() }}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); onShareToggle() }}>
                {folder.link_disabled ? <Globe className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                {folder.link_disabled ? "Enable Link" : "Disable Link"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); onDelete() }} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {label}
          </span>
          {!folder.link_disabled && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Shared
            </span>
          )}
        </div>
      </Card>
    </Link>
  )
}
