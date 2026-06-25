"use client"

import { useState, useCallback, useRef } from "react"
import { validateFiles } from "@/features/upload/utils/file-validator"
import { compressImage } from "@/features/upload/utils/compression"
import { uploadImage } from "@/features/upload/services/upload-service"
import { config } from "@/config"

export interface UploadFileItem {
  id: string
  file: File
  filename: string
  status: "pending" | "compressing" | "uploading" | "success" | "failed"
  progress: number
  error?: string
}

interface UseUploadQueueOptions {
  studioId: string
  projectId: string
  folderId?: string
  onComplete?: (results: { success: number; failed: number }) => void
  onFileComplete?: (item: UploadFileItem) => void
}

export function useUploadQueue({ studioId, projectId, folderId, onComplete, onFileComplete }: UseUploadQueueOptions) {
  const [items, setItems] = useState<UploadFileItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const activeCount = useRef(0)
  const queueRef = useRef<UploadFileItem[]>([])

  const addFiles = useCallback((files: File[]) => {
    const { accepted } = validateFiles(files)
    const newItems: UploadFileItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      filename: file.name,
      status: "pending" as const,
      progress: 0,
    }))

    setItems((prev) => [...prev, ...newItems])
    queueRef.current.push(...newItems)
    return { accepted: accepted.length, rejected: files.length - accepted.length }
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<UploadFileItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }, [])

  const processItem = useCallback(async (item: UploadFileItem): Promise<"success" | "failed"> => {
    updateItem(item.id, { status: "compressing" })

    try {
      const { blob, width, height } = await compressImage(item.file)
      updateItem(item.id, { status: "uploading", progress: 10 })

      let lastError: string | undefined
      for (let attempt = 0; attempt < config.upload.maxRetries; attempt++) {
        const result = await uploadImage(blob, item.filename, studioId, projectId, { width, height }, folderId)
        if (result.success) {
          updateItem(item.id, { status: "success", progress: 100 })
          return "success"
        }
        lastError = result.error
        if (attempt < config.upload.maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
        }
      }

      updateItem(item.id, { status: "failed", error: lastError })
      return "failed"
    } catch (err) {
      const error = err instanceof Error ? err.message : "Upload failed"
      updateItem(item.id, { status: "failed", error })
      return "failed"
    }
  }, [studioId, projectId, folderId, updateItem])

  const processQueue = useCallback(async () => {
    if (isProcessing) return
    setIsProcessing(true)

    const results = { success: 0, failed: 0 }

    while (queueRef.current.length > 0 || activeCount.current > 0) {
      while (activeCount.current < config.upload.concurrency && queueRef.current.length > 0) {
        const item = queueRef.current.shift()!

        if (!item) break

        activeCount.current++

        processItem(item)
          .then((result) => {
            if (result === "success") results.success++
            else results.failed++
            activeCount.current--
            onFileComplete?.(item)
          })
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    setIsProcessing(false)
    onComplete?.(results)
  }, [isProcessing, processItem, onComplete, onFileComplete])

  const totalProgress = items.length > 0
    ? Math.round(items.reduce((sum, item) => sum + item.progress, 0) / items.length)
    : 0

  const stats = {
    total: items.length,
    success: items.filter((i) => i.status === "success").length,
    failed: items.filter((i) => i.status === "failed").length,
    processing: items.filter((i) => i.status === "compressing" || i.status === "uploading").length,
    pending: items.filter((i) => i.status === "pending").length,
  }

  const retryFailed = useCallback(() => {
    const failedItems = items.filter((i) => i.status === "failed")
    if (failedItems.length === 0) return

    failedItems.forEach((item) => {
      updateItem(item.id, { status: "pending", progress: 0, error: undefined })
    })
    queueRef.current.push(...failedItems.map((i) => ({ ...i, status: "pending" as const, progress: 0, error: undefined })))

    if (!isProcessing) {
      processQueue()
    }
  }, [items, isProcessing, updateItem, processQueue])

  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((i) => i.status !== "success"))
    queueRef.current = queueRef.current.filter((i) => i.status !== "success")
  }, [])

  const reset = useCallback(() => {
    setItems([])
    queueRef.current = []
    activeCount.current = 0
    setIsProcessing(false)
  }, [])

  return {
    items,
    isProcessing,
    totalProgress,
    stats,
    addFiles,
    processQueue,
    retryFailed,
    clearCompleted,
    reset,
  }
}
