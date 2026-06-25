"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge"
import { deleteProject } from "@/features/projects/actions/delete-project"
import { formatDate } from "@/lib/utils/date"
import { toast } from "@/components/ui/use-toast"
import type { Database } from "@/types/database"

type Project = Database["public"]["Tables"]["projects"]["Row"]

interface ProjectListProps {
  projects: Project[]
  isLoading: boolean
}

export function ProjectList({ projects, isLoading }: ProjectListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    const result = await deleteProject(deleteId)
    setIsDeleting(false)
    setDeleteId(null)

    if (result.success) {
      toast({ title: "Project deleted" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No projects yet. Create your first project to get started.
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Event Date</TableHead>
            <TableHead>Images</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.client_name}</TableCell>
              <TableCell>
                {project.event_date ? formatDate(project.event_date) : "—"}
              </TableCell>
              <TableCell>{project.total_images}</TableCell>
              <TableCell>
                <ProjectStatusBadge status={project.status} />
              </TableCell>
              <TableCell>{formatDate(project.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/app/project/${project.id}`}>View</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(project.id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        onConfirm={handleDelete}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </>
  )
}
