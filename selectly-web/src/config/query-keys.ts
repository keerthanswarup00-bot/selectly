export const queryKeys = {
  projects: {
    all:    ["projects"] as const,
    list:   (studioId: string) => ["projects", "list", studioId] as const,
    detail: (projectId: string) => ["projects", "detail", projectId] as const,
    stats:  (studioId: string) => ["projects", "stats", studioId] as const,
  },
  folders: {
    list:   (projectId: string) => ["folders", "list", projectId] as const,
    detail: (folderId: string) => ["folders", "detail", folderId] as const,
  },
  images: {
    list:  (folderId: string) => ["images", "list", folderId] as const,
    count: (folderId: string) => ["images", "count", folderId] as const,
  },
  dashboard: {
    stats: (studioId: string) => ["dashboard", "stats", studioId] as const,
  },
}
