export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? "Selixo",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  },
  upload: {
    maxFileSizeMB: Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB ?? 20),
    maxFileSizeBytes: Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB ?? 20) * 1024 * 1024,
    concurrency: Number(process.env.NEXT_PUBLIC_UPLOAD_CONCURRENCY ?? 5),
    previewWidth: Number(process.env.NEXT_PUBLIC_PREVIEW_WIDTH ?? 1200),
    previewQuality: Number(process.env.NEXT_PUBLIC_PREVIEW_QUALITY ?? 0.8),
    maxRetries: 3,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/bmp",
      "image/gif",
      "image/tiff",
    ] as const,
    allowedExtensions: [
      ".jpg", ".jpeg", ".png", ".webp",
      ".heic", ".bmp", ".gif", ".tiff", ".tif",
    ] as const,
  },
  storage: {
    buckets: {
      previews: "previews",
    },
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  query: {
    staleTimes: {
      projectList: 30_000,
      projectDetail: 60_000,
      imageList: 120_000,
      dashboardStats: 30_000,
      studioSettings: 300_000,
    },
  },
} as const

export type Config = typeof config
