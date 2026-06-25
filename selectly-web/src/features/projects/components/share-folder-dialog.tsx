"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useFolder, useToggleFolderShare } from "@/features/folders/hooks/use-folders"
import { getFolderLink } from "@/features/folders/actions/folder-actions"
import { Copy, Check, Globe, Lock } from "lucide-react"

interface ShareFolderDialogProps {
  folderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareFolderDialog({ folderId, open, onOpenChange }: ShareFolderDialogProps) {
  const { data: folder } = useFolder(folderId)
  const toggleShare = useToggleFolderShare()
  const [linkUrl, setLinkUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (folderId && open) {
      getFolderLink(folderId).then((res) => {
        if (res.success) setLinkUrl(res.data.url)
      })
    }
  }, [folderId, open])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(linkUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: "Link copied!" })
    } catch {
      const el = document.createElement("textarea")
      el.value = linkUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleToggleShare() {
    if (!folder) return
    toggleShare.mutate({ folderId, enabled: folder.link_disabled }, {
      onSuccess: () => {
        toast({ title: folder.link_disabled ? "Folder shared" : "Sharing disabled" })
      },
    })
  }

  if (!folder) return null

  const isShared = !folder.link_disabled

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share &quot;{folder.name}&quot;</DialogTitle>
          <DialogDescription>
            Share this folder with clients so they can select photos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              {isShared ? <Globe className="h-4 w-4 text-blue-600" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">{isShared ? "Shared" : "Not shared"}</p>
                <p className="text-xs text-muted-foreground">
                  {isShared ? "Clients can access this folder" : "No one can access this folder"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleToggleShare} disabled={toggleShare.isPending}>
              {isShared ? "Disable" : "Enable"}
            </Button>
          </div>

          {isShared && (
            <div className="space-y-2">
              <Label htmlFor="share-link">Share Link</Label>
              <div className="flex gap-2">
                <Input id="share-link" value={linkUrl} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy link">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send this link to your client. They&apos;ll be able to view and select photos.
              </p>
            </div>
          )}

          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Selection rules:</strong>{" "}
              {folder.selection_type === "no_limit" && "No limit on selections"}
              {folder.selection_type === "minimum" && `Minimum ${folder.min_count} selections required`}
              {folder.selection_type === "range" && `Select between ${folder.min_count} and ${folder.max_count} photos`}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
