import { createClient } from "@/lib/supabase/client"
import { buildPreviewPath } from "@/lib/utils/storage-paths"
import { config } from "@/config"

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

  const { data: urlData } = supabase.storage
    .from(config.storage.buckets.previews)
    .getPublicUrl(storagePath)

  const { error: dbError } = await supabase.from("project_images").insert({
    project_id: projectId,
    studio_id: studioId,
    filename,
    storage_path: storagePath,
    file_size: file.size,
    mime_type: "image/jpeg",
  })

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  return { success: true, storagePath }
}
