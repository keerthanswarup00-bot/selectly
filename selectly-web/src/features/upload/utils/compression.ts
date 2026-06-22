import { config } from "@/config"

export async function compressImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)

  const targetWidth = config.upload.previewWidth
  const scale = Math.min(targetWidth / bitmap.width, 1)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context")

  ctx.drawImage(bitmap, 0, 0, width, height)
  const blob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: config.upload.previewQuality,
  })

  bitmap.close()

  return { blob: blob ?? file, width, height }
}

export function isCompressionSupported(): boolean {
  return typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap !== "undefined"
}
