"use client"

import Image from "next/image"
import { ChevronLeft, ChevronRight, Star, ThumbsDown, ThumbsUp, X } from "lucide-react"

interface SwipeImage {
  id: string
  filename: string
  preview_url: string | null
}

interface SwipeViewProps {
  images: SwipeImage[]
  currentIndex: number
  selected: Set<string>
  highlighted: Set<string>
  rejected: Set<string>
  onSelect: (filename: string) => void
  onHighlight: (filename: string) => void
  onReject: (filename: string) => void
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}

export function SwipeView({
  images,
  currentIndex,
  selected,
  highlighted,
  rejected,
  onSelect,
  onHighlight,
  onReject,
  onNext,
  onPrev,
  onClose,
}: SwipeViewProps) {
  const current = images[currentIndex]
  if (!current) return null

  const isSelected = selected.has(current.filename)
  const isHighlighted = highlighted.has(current.filename)
  const isRejected = rejected.has(current.filename)

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 text-white">
        <button type="button" onClick={onClose} className="hover:text-white/70 transition-colors">
          <X className="h-6 w-6" />
        </button>
        <span className="text-sm text-white/70">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="w-6" />
      </div>

      {/* Image */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        <Image
          src={current.preview_url ?? "/placeholder.svg"}
          alt={current.filename}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>

      {/* Bottom controls */}
      <div className="p-4 space-y-4">
        {/* Status badges */}
        <div className="flex justify-center gap-3">
          {isHighlighted && (
            <span className="flex items-center gap-1 text-yellow-500 text-sm">
              <Star className="h-4 w-4 fill-current" /> Highlighted
            </span>
          )}
          {isSelected && !isHighlighted && (
            <span className="flex items-center gap-1 text-green-500 text-sm">
              <ThumbsUp className="h-4 w-4" /> Selected
            </span>
          )}
          {isRejected && (
            <span className="flex items-center gap-1 text-red-500 text-sm">
              <ThumbsDown className="h-4 w-4" /> Rejected
            </span>
          )}
          {!isSelected && !isRejected && (
            <span className="text-white/50 text-sm">Make a selection</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              onReject(current.filename)
              if (currentIndex < images.length - 1) onNext()
            }}
            className={`rounded-full p-3 transition-colors ${
              isRejected ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <ThumbsDown className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect(current.filename)
              if (currentIndex < images.length - 1) onNext()
            }}
            className={`rounded-full p-3 transition-colors ${
              isSelected ? "bg-green-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <ThumbsUp className="h-6 w-6" />
          </button>
          {isSelected && (
            <button
              type="button"
              onClick={() => onHighlight(current.filename)}
              className={`rounded-full p-3 transition-colors ${
                isHighlighted ? "bg-yellow-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Star className={`h-6 w-6 ${isHighlighted ? "fill-current" : ""}`} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={currentIndex >= images.length - 1}
            className="text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      </div>
    </div>
  )
}
