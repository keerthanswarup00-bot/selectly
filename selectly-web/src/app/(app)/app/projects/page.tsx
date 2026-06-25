"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useProjects } from "@/features/projects/hooks/use-projects"
import { ProjectList } from "@/features/projects/components/project-list"
import { ProjectFilters } from "@/features/projects/components/project-filters"
import { EmptyState } from "@/components/shared/empty-state"
import { PageLoading } from "@/components/shared/loading-spinner"
import { Button } from "@/components/ui/button"
import { FolderPlus, FolderOpen, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { ProjectStatus } from "@/types/project"

export default function ProjectsPage() {
  const [studioId, setStudioId] = useState<string | undefined>()
  const [filters, setFilters] = useState<{ search: string; status: ProjectStatus | "" }>({
    search: "",
    status: "",
  })
  const [loadError, setLoadError] = useState<string | null>(null)

  const { data: projects, isLoading } = useProjects(studioId)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from("profiles")
          .select("studio_id")
          .eq("id", user.id)
          .single<{ studio_id: string }>()
        if (profile) setStudioId(profile.studio_id)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load")
      }
    }
    load()
  }, [])

  const filteredProjects = useMemo(() => {
    if (!projects) return []
    return projects.filter((p) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!p.client_name.toLowerCase().includes(q)) return false
      }
      if (filters.status && p.status !== filters.status) return false
      return true
    })
  }, [projects, filters])

  if (loadError) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-12 w-12" />}
        title="Error Loading Projects"
        description={loadError}
      />
    )
  }

  if (isLoading) return <PageLoading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage all your client projects
          </p>
        </div>
        <Button asChild>
          <Link href="/app/new-project">
            <FolderPlus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects && projects.length > 0 && (
        <ProjectFilters onChange={setFilters} />
      )}

      {!projects || projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title="No Projects Yet"
          description="Create your first project to begin uploading photos and sharing with clients."
          action={{ label: "Create Project", href: "/app/new-project" }}
        />
      ) : (
        <ProjectList projects={filteredProjects} isLoading={false} />
      )}
    </div>
  )
}
