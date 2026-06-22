export const queryKeys = {
  projects: {
    all:    ["projects"] as const,
    list:   (studioId: string) => ["projects", "list", studioId] as const,
    detail: (projectId: string) => ["projects", "detail", projectId] as const,
    stats:  (studioId: string) => ["projects", "stats", studioId] as const,
  },
  images: {
    list:  (projectId: string) => ["images", "list", projectId] as const,
    count: (projectId: string) => ["images", "count", projectId] as const,
  },
  dashboard: {
    stats: (studioId: string) => ["dashboard", "stats", studioId] as const,
  },
}
