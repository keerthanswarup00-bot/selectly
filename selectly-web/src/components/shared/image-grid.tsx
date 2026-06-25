"use client"

import Image from "next/image"
import { useState, memo } from "react"
import { cn } from "@/lib/utils/cn"
import { Check, Star, ThumbsDown } from "lucide-react"

interface GridImage {
  id: string
  filename: string
  preview_url: string | null
}

interface ImageGridProps {
  images: GridImage[]
  selected: Set<string>
  highlighted: Set<string>
  rejected: Set<string>
  onToggleSelect: (filename: string) => void
  onToggleHighlight: (filename: string) => void
  onToggleReject: (filename: string) => void
  onImageClick: (filename: string) => void
  compact?: boolean
}

const GridImageItem = memo(function GridImageItem({
  image,
  isSelected,
  isHighlighted,
  isRejected,
  onToggleSelect,
  onToggleHighlight,
  onToggleReject,
  onImageClick,
  compact,
}: {
  image: GridImage
  isSelected: boolean
  isHighlighted: boolean
  isRejected: boolean
  onToggleSelect: (filename: string) => void
  onToggleHighlight: (filename: string) => void
  onToggleReject: (filename: string) => void
  onImageClick: (filename: string) => void
  compact: boolean
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      className={cn(
        "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
        isHighlighted ? "border-yellow-500 ring-2 ring-yellow-500/50" : "",
        isSelected && !isHighlighted ? "border-green-500" : "",
        isRejected ? "border-red-500/50" : "",
        !isSelected && !isRejected ? "border-transparent hover:border-muted-foreground/30" : "",
        !loaded && "bg-muted animate-pulse",
      )}
      onClick={() => onImageClick(image.filename)}
      role="button"
      tabIndex={0}
      aria-label={`Image ${image.filename}${isSelected ? ", selected" : ""}${isHighlighted ? ", highlighted" : ""}${isRejected ? ", rejected" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onImageClick(image.filename)
        }
      }}
    >
      <div className={cn(compact ? "aspect-[4/3]" : "aspect-square")}>
        <Image
          src={image.preview_url ?? "/placeholder.svg"}
          alt={image.filename}
          fill
          className={cn(
            "object-cover transition-all",
            "group-hover:brightness-75",
            isRejected && "opacity-60",
            loaded ? "opacity-100" : "opacity-0",
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      </div>

      <div
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-1"
        aria-hidden="true"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect(image.filename)
          }}
          className={cn(
            "rounded-full p-2 transition-all focus:outline-none focus:ring-2 focus:ring-white",
            isSelected ? "bg-green-500 text-white scale-110" : "bg-white/20 text-white hover:bg-white/40",
          )}
          title={isSelected ? "Deselect" : "Select"}
          aria-label={isSelected ? `Deselect ${image.filename}` : `Select ${image.filename}`}
        >
          <Check className="h-5 w-5" />
        </button>
        {isSelected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleHighlight(image.filename)
            }}
            className={cn(
              "rounded-full p-2 transition-all focus:outline-none focus:ring-2 focus:ring-white",
              isHighlighted ? "bg-yellow-500 text-white scale-110" : "bg-white/20 text-white hover:bg-white/40",
            )}
            title={isHighlighted ? "Remove highlight" : "Highlight"}
            aria-label={isHighlighted ? `Unhighlight ${image.filename}` : `Highlight ${image.filename}`}
          >
            <Star className={cn("h-5 w-5", isHighlighted && "fill-current")} />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleReject(image.filename)
          }}
          className={cn(
            "rounded-full p-2 transition-all focus:outline-none focus:ring-2 focus:ring-white",
            isRejected ? "bg-red-500 text-white scale-110" : "bg-white/20 text-white hover:bg-white/40",
          )}
          title={isRejected ? "Unreject" : "Reject"}
          aria-label={isRejected ? `Unreject ${image.filename}` : `Reject ${image.filename}`}
        >
          <ThumbsDown className="h-5 w-5" />
        </button>
      </div>

      {!isSelected && !isRejected && !isHighlighted && (
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs bg-black/50 text-white px-1.5 py-0.5 rounded" />
        </div>
      )}

      {isHighlighted && (
        <div className="absolute top-1.5 left-1.5 bg-yellow-500 rounded-full p-1 shadow-lg">
          <Star className="h-3 w-3 text-white fill-current" aria-label="Highlighted" />
        </div>
      )}
      {isSelected && !isHighlighted && (
        <div className="absolute top-1.5 right-1.5 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
          <Check className="h-3 w-3" aria-label="Selected" />
        </div>
      )}
      {isRejected && (
        <div className="absolute top-1.5 right-1.5 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
          <ThumbsDown className="h-3 w-3" aria-label="Rejected" />
        </div>
      )}
    </div>
  )
})

export function ImageGrid({
  images,
  selected,
  highlighted,
  rejected,
  onToggleSelect,
  onToggleHighlight,
  onToggleReject,
  onImageClick,
  compact = false,
}: ImageGridProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        compact ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8" : "grid-cols-2 md:grid-cols-4",
      )}
    >
      {images.map((image) => (
        <GridImageItem
          key={image.id}
          image={image}
          isSelected={selected.has(image.filename)}
          isHighlighted={highlighted.has(image.filename)}
          isRejected={rejected.has(image.filename)}
          onToggleSelect={onToggleSelect}
          onToggleHighlight={onToggleHighlight}
          onToggleReject={onToggleReject}
          onImageClick={onImageClick}
          compact={compact}
        />
      ))}
    </div>
  )
}
