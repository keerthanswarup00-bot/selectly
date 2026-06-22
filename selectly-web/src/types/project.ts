export interface ProjectWithDetails {
  id: string
  clientName: string
  eventDate: string | null
  targetCount: number
  minCount: number
  maxCount: number
  status: ProjectStatus
  totalImages: number
  linkToken: string
  createdAt: string
  updatedAt: string
}

export type ProjectStatus =
  | "draft"
  | "uploading"
  | "uploaded"
  | "selecting"
  | "submitted"
  | "completed"

export interface ProjectStats {
  draft: number
  uploading: number
  selecting: number
  completed: number
  total: number
}

export type SortField = "createdAt" | "clientName" | "status" | "eventDate"
export type SortDirection = "asc" | "desc"

export interface ProjectFilters {
  status?: ProjectStatus
  search?: string
  sortField?: SortField
  sortDirection?: SortDirection
}
