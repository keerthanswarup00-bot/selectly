import { config } from "@/config"

const ALLOWED_TYPES = new Set(config.upload.allowedMimeTypes)
const ALLOWED_EXTS = new Set(config.upload.allowedExtensions)

export interface FileValidationResult {
  valid: boolean
  reason?: string
}

export function validateFile(file: File): FileValidationResult {
  const ext = "." + file.name.split(".").pop()?.toLowerCase()
  if (!ALLOWED_EXTS.has(ext) && !ALLOWED_TYPES.has(file.type)) {
    return {
      valid: false,
      reason: `"${file.name}" is not a supported image format`,
    }
  }

  if (file.size > config.upload.maxFileSizeBytes) {
    return {
      valid: false,
      reason: `"${file.name}" exceeds ${config.upload.maxFileSizeMB}MB limit`,
    }
  }

  return { valid: true }
}

export interface FileBatchValidationResult {
  accepted: File[]
  rejected: { file: File; reason: string }[]
}

export function validateFiles(files: File[]): FileBatchValidationResult {
  const accepted: File[] = []
  const rejected: { file: File; reason: string }[] = []

  for (const file of files) {
    const result = validateFile(file)
    if (result.valid) {
      accepted.push(file)
    } else {
      rejected.push({ file, reason: result.reason! })
    }
  }

  return { accepted, rejected }
}
