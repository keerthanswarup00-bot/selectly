import { createClient } from "@/lib/supabase/client"
import { buildPreviewPath } from "@/lib/utils/storage-paths"
import { config } from "@/config"

const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 30 // 30 days in seconds

export interface UploadResult {
  success: boolean
  storagePath?: string
  error?: string
}

export async function uploadImage(
  file: Blob,
  filename: string,
  studioId: string,
  projectId: string,
  dimensions?: { width: number; height: number },
): Promise<UploadResult> {
  const supabase = createClient()
  const storagePath = buildPreviewPath(studioId, projectId, filename)

  const { error: uploadError } = await supabase.storage
    .from(config.storage.buckets.previews)
    .upload(storagePath, file, {
      contentType: "image/jpeg",
      upsert: false,
    })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  // Generate signed URL for client access
  let previewUrl: string | null = null
  let previewExpiresAt: string | null = null
  const { data: urlData } = await supabase.storage
    .from(config.storage.buckets.previews)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

  if (urlData?.signedUrl) {
    previewUrl = urlData.signedUrl
    previewExpiresAt = new Date(
      Date.now() + SIGNED_URL_EXPIRY * 1000,
    ).toISOString()
  }

  const { error: dbError } = await supabase.from("project_images").insert({
    project_id: projectId,
    studio_id: studioId,
    filename,
    storage_path: storagePath,
    preview_url: previewUrl,
    preview_expires_at: previewExpiresAt,
    file_size: file.size,
    mime_type: "image/jpeg",
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
  })

  if (dbError) {
    // Clean up storage to avoid orphaned files
    await supabase.storage
      .from(config.storage.buckets.previews)
      .remove([storagePath])
    return { success: false, error: dbError.message }
  }

  return { success: true, storagePath }
}
