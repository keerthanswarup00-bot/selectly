"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import type { ProjectStatus } from "@/types/project"

interface ProjectFiltersState {
  search: string
  status: ProjectStatus | ""
}

interface ProjectFiltersProps {
  onChange: (filters: ProjectFiltersState) => void
}

export function ProjectFilters({ onChange }: ProjectFiltersProps) {
  const [filters, setFilters] = useState<ProjectFiltersState>({ search: "", status: "" })

  const updateFilters = useCallback(
    (update: Partial<ProjectFiltersState>) => {
      const next = { ...filters, ...update }
      setFilters(next)
      onChange(next)
    },
    [filters, onChange],
  )

  const clearFilters = useCallback(() => {
    const cleared = { search: "", status: "" as const }
    setFilters(cleared)
    onChange(cleared)
  }, [onChange])

  const hasFilters = filters.search || filters.status

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-8"
          aria-label="Search projects"
        />
      </div>
      <select
        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={filters.status}
        onChange={(e) => updateFilters({ status: e.target.value as ProjectStatus | "" })}
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="uploading">Uploading</option>
        <option value="selecting">Selecting</option>
        <option value="submitted">Submitted</option>
        <option value="completed">Completed</option>
      </select>
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters} aria-label="Clear filters">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
