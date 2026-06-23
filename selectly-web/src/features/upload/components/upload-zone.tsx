"use client"

import { useCallback, useRef, useState } from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function UploadZone({ onFilesSelected, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) onFilesSelected(files)
  }, [disabled, onFilesSelected])

  const handleClick = () => inputRef.current?.click()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick()
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) onFilesSelected(files)
    e.target.value = ""
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload images: drag and drop or click to browse"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />
      <div className="mb-4 rounded-full bg-muted p-4">
        <Upload className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="mb-1 text-sm font-medium">
        {isDragging ? "Drop files here" : "Drag & drop files or click to browse"}
      </p>
      <p className="text-xs text-muted-foreground">
        Supports JPG, PNG, WebP, HEIC, BMP, GIF, TIFF &mdash; Max 20MB each
      </p>
    </div>
  )
}
