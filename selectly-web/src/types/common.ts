export type AsyncResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface SelectOption {
  label: string
  value: string
}

export interface BreadcrumbItem {
  label: string
  href?: string
}
