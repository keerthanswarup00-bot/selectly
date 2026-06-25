import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { buildPreviewPath } from "@/lib/utils/storage-paths"
import { config } from "@/config"
import { logger } from "@/lib/logger"

const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 30

const ALLOWED_TYPES = new Set(config.upload.allowedMimeTypes) as Set<string>
const ALLOWED_EXTS = new Set(config.upload.allowedExtensions) as Set<string>

function validateFile(filename: string, size: number, mimeType: string): string | null {
  const ext = "." + filename.split(".").pop()?.toLowerCase()
  if (!ALLOWED_EXTS.has(ext) && !ALLOWED_TYPES.has(mimeType)) {
    return `"${filename}" is not a supported image format`
  }

  if (size > config.upload.maxFileSizeBytes) {
    return `"${filename}" exceeds ${config.upload.maxFileSizeMB}MB limit`
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const studioId = formData.get("studioId") as string | null
    const projectId = formData.get("projectId") as string | null
    const folderId = formData.get("folderId") as string | null
    const width = formData.get("width") ? Number(formData.get("width")) : null
    const height = formData.get("height") ? Number(formData.get("height")) : null

    if (!file || !studioId || !projectId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: file, studioId, projectId" },
        { status: 400 },
      )
    }

    // Server-side validation
    const validationError = validateFile(file.name, file.size, file.type)
    if (validationError) {
      logger.warn("upload-api", "File rejected by server validation", {
        filename: file.name,
        reason: validationError,
      })
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 },
      )
    }

    const server = await createServerClient()
    const { data: { user } } = await server.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      )
    }

    const admin = createAdminClient()
    const storagePath = buildPreviewPath(studioId, projectId, file.name)

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from(config.storage.buckets.previews)
      .upload(storagePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      })

    if (uploadError) {
      logger.error("upload-api", "Storage upload failed", {
        path: storagePath,
        error: uploadError,
      })
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 },
      )
    }

    let previewUrl: string | null = null
    let previewExpiresAt: string | null = null
    const { data: urlData } = await admin.storage
      .from(config.storage.buckets.previews)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

    if (urlData?.signedUrl) {
      previewUrl = urlData.signedUrl
      previewExpiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString()
    }

    const { error: dbError } = await admin.from("project_images").insert({
      project_id: projectId,
      folder_id: folderId,
      studio_id: studioId,
      filename: file.name,
      storage_path: storagePath,
      preview_url: previewUrl,
      preview_expires_at: previewExpiresAt,
      file_size: file.size,
      mime_type: file.type || "image/jpeg",
      width,
      height,
    })

    if (dbError) {
      await admin.storage
        .from(config.storage.buckets.previews)
        .remove([storagePath])

      logger.error("upload-api", "DB insert failed, storage cleaned up", {
        path: storagePath,
        error: dbError,
      })

      return NextResponse.json(
        { success: false, error: dbError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      storagePath,
    })
  } catch (error) {
    logger.error("upload-api", "Upload failed", { error })
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    )
  }
}
