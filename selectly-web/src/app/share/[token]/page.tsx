"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, AlertCircle, Eye, Grid3X3 } from "lucide-react"
import { ImageGrid } from "@/components/shared/image-grid"
import { SwipeView } from "@/components/shared/swipe-view"
import { useSwipe } from "@/hooks/use-swipe"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/shared/progress-bar"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorBoundary } from "@/components/shared/error-boundary"

interface ProjectData {
  client_name: string
  event_date: string | null
  target_count: number
  min_count: number
  max_count: number
  status: string
  studio_name: string | null
}

interface ImageData {
  id: string
  filename: string
  preview_url: string | null
}

type ViewMode = "gallery" | "swipe"

export default function SelectPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [project, setProject] = useState<ProjectData | null>(null)
  const [images, setImages] = useState<ImageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())
  const [rejected, setRejected] = useState<Set<string>>(new Set())

  const [viewMode, setViewMode] = useState<ViewMode>("gallery")
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, imagesRes] = await Promise.all([
          fetch(`/api/select/${token}`),
          fetch(`/api/select/${token}/images`),
        ])

        if (!projectRes.ok) {
          const err = await projectRes.json()
          throw new Error(err.error ?? "Project not found")
        }

        const projectData = await projectRes.json()
        setProject(projectData)

        if (imagesRes.ok) {
          const imagesData = await imagesRes.json()
          setImages(imagesData.images)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setIsLoading(false)
      }
    }

    if (token) fetchData()
  }, [token])

  const skipped = useMemo(() => {
    const decided = new Set([...selected, ...rejected])
    return images.filter((img) => !decided.has(img.filename)).length
  }, [images, selected, rejected])

  const canSubmit = useMemo(() => {
    return (
      skipped === 0 &&
      selected.size >= (project?.min_count ?? 0) &&
      selected.size <= (project?.max_count ?? Infinity)
    )
  }, [skipped, selected, project])

  async function handleSubmit() {
    if (!canSubmit || submitting || !project) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(`/api/select/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected: Array.from(selected),
          highlighted: Array.from(highlighted),
        }),
      })

      if (res.ok) {
        router.push(`/share/${token}/thank-you`)
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

  if (error || !project) {
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
          description="The studio hasn&apos;t uploaded any images yet. Please check back later."
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
                {project.studio_name && (
                  <p className="text-xs text-muted-foreground truncate">{project.studio_name}</p>
                )}
                <h1 className="text-lg font-semibold truncate">{project.client_name}</h1>
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
            <ProgressBar
              value={selected.size}
              max={project.max_count}
              label="Selected"
              showPercent
              size="sm"
              color={selected.size >= project.min_count ? "success" : "default"}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Skipped: {skipped}</span>
              <span>Rejected: {rejected.size}</span>
              <span>Target: {project.target_count}</span>
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
                onSelect={(filename) => {
                  toggleSelect(filename)
                }}
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
            <div className="max-w-6xl mx-auto px-4 py-3">
              {submitError && (
                <p className="text-sm text-destructive mb-2" role="alert">{submitError}</p>
              )}
              {!canSubmit && skipped > 0 && (
                <p className="text-sm text-muted-foreground mb-2">
                  Please decide on {skipped} photo{skipped !== 1 ? "s" : ""} before submitting.
                </p>
              )}
              {!canSubmit && skipped === 0 && (
                <p className="text-sm text-muted-foreground mb-2">
                  Select between {project.min_count} and {project.max_count} photos.
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
