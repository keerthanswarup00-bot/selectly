export function buildPreviewPath(
  studioId: string,
  projectId: string,
  filename: string,
): string {
  return `${studioId}/${projectId}/${filename}`
}

export function buildProjectPrefix(
  studioId: string,
  projectId: string,
): string {
  return `${studioId}/${projectId}/`
}

export function getStudioPrefix(studioId: string): string {
  return `${studioId}/`
}

export function parseStoragePath(
  path: string,
): { studioId: string; projectId: string; filename: string } | null {
  const parts = path.split("/")
  if (parts.length !== 3) return null
  return {
    studioId: parts[0]!,
    projectId: parts[1]!,
    filename: parts[2]!,
  }
}
