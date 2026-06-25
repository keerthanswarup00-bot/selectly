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
  folderId?: string,
): Promise<UploadResult> {
  try {
    const formData = new FormData()
    formData.append("file", new File([file], filename, { type: "image/jpeg" }))
    formData.append("studioId", studioId)
    formData.append("projectId", projectId)
    if (folderId) formData.append("folderId", folderId)
    if (dimensions?.width) formData.append("width", String(dimensions.width))
    if (dimensions?.height) formData.append("height", String(dimensions.height))

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const result = await res.json()

    if (!res.ok) {
      return { success: false, error: result.error ?? "Upload failed" }
    }

    return { success: true, storagePath: result.storagePath }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Upload failed"
    return { success: false, error }
  }
}
