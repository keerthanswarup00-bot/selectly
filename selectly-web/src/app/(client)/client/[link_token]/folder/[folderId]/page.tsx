"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, AlertCircle, Eye, Grid3X3, ArrowLeft, CheckCircle } from "lucide-react"
import { ImageGrid } from "@/components/shared/image-grid"
import { SwipeView } from "@/components/shared/swipe-view"
import { useSwipe } from "@/hooks/use-swipe"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/shared/progress-bar"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorBoundary } from "@/components/shared/error-boundary"

interface FolderData {
  name: string
  description: string | null
  selection_type: string
  min_count: number
  max_count: number
  total_images: number
  status: string
  client_name: string
  studio_name: string | null
}

interface ImageData {
  id: string
  filename: string
  preview_url: string | null
}

type ViewMode = "gallery" | "swipe"

export default function ClientFolderPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.link_token as string
  const folderId = params.folderId as string

  const [folder, setFolder] = useState<FolderData | null>(null)
  const [images, setImages] = useState<ImageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientName, setClientName] = useState("")

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())
  const [rejected, setRejected] = useState<Set<string>>(new Set())
  const [, setShowNamePrompt] = useState(true)

  const [viewMode, setViewMode] = useState<ViewMode>("gallery")
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/client/${token}/folder/${folderId}`)
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? "Not found")
        }
        const data = await res.json()
        setFolder(data.folder)
        setImages(data.images)
        if (data.selection?.selected) {
          setSelected(new Set(data.selection.selected))
          setClientName(data.selection.client_name || "")
          if (data.selection.selected.length > 0) setShowNamePrompt(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setIsLoading(false)
      }
    }
    if (token && folderId) fetchData()
  }, [token, folderId])

  const minCount = folder?.min_count ?? 0
  const maxCount = folder?.max_count ?? Infinity

  const notDecided = useMemo(() => {
    const decided = new Set([...selected, ...rejected])
    return images.filter((img) => !decided.has(img.filename)).length
  }, [images, selected, rejected])

  const canSubmit = useMemo(() => {
    return notDecided === 0
      && selected.size >= minCount
      && selected.size <= maxCount
      && clientName.trim().length > 0
  }, [notDecided, selected, minCount, maxCount, clientName])

  const atMax = useMemo(() => {
    if (folder?.selection_type === "no_limit") return false
    return selected.size >= maxCount
  }, [selected, maxCount, folder])

  async function handleSubmit() {
    if (!canSubmit || submitting || !folder) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(`/api/client/${token}/folder/${folderId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected: Array.from(selected),
          highlighted: Array.from(highlighted),
          client_name: clientName.trim(),
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const err = await res.json()
        setSubmitError(err.error ?? "Submission failed")
      }
    } catch {
      setSubmitError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSelect = (filename: string) => {
    if (atMax && !selected.has(filename)) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(filename)) next.delete(filename)
      else next.add(filename)
      return next
    })
    setRejected((prev) => {
      const next = new Set(prev)
      next.delete(filename)
      return next
    })
  }

  const toggleReject = (filename: string) => {
    setRejected((prev) => {
      const next = new Set(prev)
      if (next.has(filename)) next.delete(filename)
      else next.add(filename)
      return next
    })
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(filename)
      return next
    })
    setHighlighted((prev) => {
      const next = new Set(prev)
      next.delete(filename)
      return next
    })
  }

  const toggleHighlight = (filename: string) => {
    setHighlighted((prev) => {
      const next = new Set(prev)
      if (next.has(filename)) next.delete(filename)
      else next.add(filename)
      return next
    })
  }

  const openSwipe = (filename: string) => {
    const idx = images.findIndex((img) => img.filename === filename)
    if (idx >= 0) {
      setSwipeIndex(idx)
      setViewMode("swipe")
    }
  }

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe((direction) => {
    const currentImage = images[swipeIndex]
    if (!currentImage) return
    if (direction === "left") {
      toggleReject(currentImage.filename)
      if (swipeIndex < images.length - 1) setSwipeIndex((i) => i + 1)
    } else if (direction === "right") {
      toggleSelect(currentImage.filename)
      if (swipeIndex < images.length - 1) setSwipeIndex((i) => i + 1)
    } else if (direction === "up") {
      toggleHighlight(currentImage.filename)
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold">Selection Submitted!</h1>
          <p className="text-muted-foreground mt-2">
            Thank you, {clientName}. Your selections have been submitted to the studio.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push(`/client/${token}`)}
          >
            Back to Folders
          </Button>
        </div>
      </div>
    )
  }

  if (error || !folder) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Selection Not Available</h1>
          <p className="text-muted-foreground mt-2">{error ?? "This link may be invalid or expired."}</p>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title="No Images Available"
          description="The studio hasn&apos;t uploaded any images to this folder yet."
        />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0 flex-1">
                <Link href={`/client/${token}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-0.5">
                  <ArrowLeft className="h-3 w-3" />
                  Back to folders
                </Link>
                {folder.studio_name && (
                  <p className="text-xs text-muted-foreground truncate">{folder.studio_name}</p>
                )}
                <h1 className="text-lg font-semibold truncate">{folder.client_name} &mdash; {folder.name}</h1>
                {folder.description && (
                  <p className="text-xs text-muted-foreground truncate">{folder.description}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => setViewMode("gallery")}
                  className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                    viewMode === "gallery" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Gallery view"
                  aria-pressed={viewMode === "gallery"}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("swipe")}
                  className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                    viewMode === "swipe" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Swipe view"
                  aria-pressed={viewMode === "swipe"}
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Progress */}
            {folder.selection_type !== "no_limit" && (
              <ProgressBar
                value={selected.size}
                max={maxCount}
                label="Selected"
                showPercent
                size="sm"
                color={selected.size >= minCount ? "success" : "default"}
              />
            )}
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Selected: {selected.size}</span>
              <span>Skipped: {notDecided}</span>
              <span>Rejected: {rejected.size}</span>
              {folder.selection_type !== "no_limit" && (
                <span>Min: {minCount} / Max: {maxCount > 999 ? "∞" : maxCount}</span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-4">
          {viewMode === "gallery" ? (
            <ImageGrid
              images={images}
              selected={selected}
              highlighted={highlighted}
              rejected={rejected}
              onToggleSelect={toggleSelect}
              onToggleHighlight={toggleHighlight}
              onToggleReject={toggleReject}
              onImageClick={openSwipe}
            />
          ) : (
            <div
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <SwipeView
                images={images}
                currentIndex={swipeIndex}
                selected={selected}
                highlighted={highlighted}
                rejected={rejected}
                onSelect={(filename) => toggleSelect(filename)}
                onHighlight={toggleHighlight}
                onReject={toggleReject}
                onNext={() => setSwipeIndex((i) => Math.min(i + 1, images.length - 1))}
                onPrev={() => setSwipeIndex((i) => Math.max(i - 1, 0))}
                onClose={() => setViewMode("gallery")}
              />
            </div>
          )}
        </div>

        {/* Submit footer */}
        {viewMode === "gallery" && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
            <div className="max-w-6xl mx-auto px-4 py-3 space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Your name (required)"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {submitError && (
                <p className="text-sm text-destructive" role="alert">{submitError}</p>
              )}
              {!canSubmit && notDecided > 0 && (
                <p className="text-sm text-muted-foreground">
                  Please decide on {notDecided} photo{notDecided !== 1 ? "s" : ""} before submitting.
                </p>
              )}
              {atMax && (
                <p className="text-sm text-amber-600">
                  Maximum selection reached. Deselect a photo to choose another.
                </p>
              )}
              {!canSubmit && notDecided === 0 && folder.selection_type !== "no_limit" && (
                <p className="text-sm text-muted-foreground">
                  {selected.size < minCount
                    ? `Select at least ${minCount} photos (${selected.size} selected).`
                    : selected.size > maxCount
                    ? `You can select at most ${maxCount} photos.`
                    : "Enter your name to submit."}
                </p>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? "Submitting..." : "Submit Selection"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
