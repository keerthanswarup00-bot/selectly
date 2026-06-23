"use client"

import Image from "next/image"
import { Check, Star, ThumbsDown } from "lucide-react"

interface GalleryImage {
  id: string
  filename: string
  preview_url: string | null
}

interface GalleryViewProps {
  images: GalleryImage[]
  selected: Set<string>
  highlighted: Set<string>
  rejected: Set<string>
  onToggleSelect: (filename: string) => void
  onToggleHighlight: (filename: string) => void
  onToggleReject: (filename: string) => void
  onImageClick: (filename: string) => void
}

export function GalleryView({
  images,
  selected,
  highlighted,
  rejected,
  onToggleSelect,
  onToggleHighlight,
  onToggleReject,
  onImageClick,
}: GalleryViewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {images.map((image) => {
        const isSelected = selected.has(image.filename)
        const isHighlighted = highlighted.has(image.filename)
        const isRejected = rejected.has(image.filename)

        return (
          <div
            key={image.id}
            className={`relative aspect-square group cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
              isHighlighted
                ? "border-yellow-500"
                : isSelected
                  ? "border-green-500"
                  : isRejected
                    ? "border-red-500/50"
                    : "border-transparent"
            }`}
            onClick={() => onImageClick(image.filename)}
          >
            <Image
              src={image.preview_url ?? "/placeholder.svg"}
              alt={image.filename}
              fill
              className="object-cover group-hover:brightness-75 transition-all"
              sizes="(max-width: 768px) 50vw, 25vw"
            />

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSelect(image.filename)
                }}
                className={`rounded-full p-2 transition-colors ${
                  isSelected ? "bg-green-500 text-white" : "bg-white/20 text-white hover:bg-white/40"
                }`}
                title={isSelected ? "Deselect" : "Select"}
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
                  className={`rounded-full p-2 transition-colors ${
                    isHighlighted ? "bg-yellow-500 text-white" : "bg-white/20 text-white hover:bg-white/40"
                  }`}
                  title={isHighlighted ? "Remove highlight" : "Highlight"}
                >
                  <Star className={`h-5 w-5 ${isHighlighted ? "fill-current" : ""}`} />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleReject(image.filename)
                }}
                className={`rounded-full p-2 transition-colors ${
                  isRejected ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/40"
                }`}
                title={isRejected ? "Unreject" : "Reject"}
              >
                <ThumbsDown className="h-5 w-5" />
              </button>
            </div>

            {isHighlighted && (
              <div className="absolute top-1 left-1 bg-yellow-500 rounded-full p-1">
                <Star className="h-3 w-3 text-white fill-current" />
              </div>
            )}
            {isSelected && !isHighlighted && (
              <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                <Check className="h-3 w-3" />
              </div>
            )}
            {isRejected && (
              <div className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                <ThumbsDown className="h-3 w-3" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
