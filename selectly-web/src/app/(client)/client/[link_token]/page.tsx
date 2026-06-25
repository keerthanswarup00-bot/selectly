"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Loader2, AlertCircle, FolderOpen, Lock, Globe, CheckCircle } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorBoundary } from "@/components/shared/error-boundary"

interface FolderData {
  id: string
  name: string
  description: string | null
  selection_type: string
  min_count: number
  max_count: number
  total_images: number
  status: string
}

interface ProjectData {
  client_name: string
  event_date: string | null
  studio_name: string | null
  welcome_message: string | null
}

export default function ClientDashboardPage() {
  const params = useParams()
  const token = params.link_token as string

  const [project, setProject] = useState<ProjectData | null>(null)
  const [folders, setFolders] = useState<FolderData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/client/${token}`)
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? "Not found")
        }
        const data = await res.json()
        setProject(data.project)
        setFolders(data.folders)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setIsLoading(false)
      }
    }
    if (token) fetchData()
  }, [token])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Not Available</h1>
          <p className="text-muted-foreground mt-2">{error ?? "This link may be invalid or expired."}</p>
        </div>
      </div>
    )
  }

  if (folders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title="No Folders Available"
          description="The studio hasn't shared any folders yet. Please check back later."
        />
      </div>
    )
  }

  const allCompleted = folders.every(f => f.status === "submitted" || f.status === "approved")

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            {project.studio_name && (
              <p className="text-sm text-muted-foreground">{project.studio_name}</p>
            )}
            <h1 className="text-3xl font-bold tracking-tight mt-1">{project.client_name}</h1>
            {project.event_date && (
              <p className="text-sm text-muted-foreground mt-1">{project.event_date}</p>
            )}
            {project.welcome_message && (
              <p className="text-muted-foreground mt-2">{project.welcome_message}</p>
            )}
          </div>

          {allCompleted && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700">All selections have been submitted. Thank you!</p>
            </div>
          )}

          <div className="space-y-3">
            {folders.map((folder) => {
              const label = folder.selection_type === "minimum" ? `Select at least ${folder.min_count}`
                : folder.selection_type === "range" ? `Select ${folder.min_count}–${folder.max_count} photos`
                : "No selection limit"

              const isDone = folder.status === "submitted" || folder.status === "approved"
              const isReady = folder.status === "shared" || folder.status === "viewing" || folder.status === "in_progress"

              return (
                <Link
                  key={folder.id}
                  href={isReady ? `/client/${token}/folder/${folder.id}` : "#"}
                  className={`block rounded-xl border p-4 transition-all ${
                    isReady ? "hover:shadow-md hover:border-primary/50 cursor-pointer" : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg p-2.5 mt-0.5 ${isDone ? "bg-green-100" : "bg-primary/10"}`}>
                        {isDone ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : isReady ? (
                          <Globe className="h-5 w-5 text-primary" />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{folder.name}</p>
                        {folder.description && (
                          <p className="text-sm text-muted-foreground">{folder.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-muted-foreground">{folder.total_images} photos</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{label}</span>
                        </div>
                      </div>
                    </div>
                    {isDone && (
                      <span className="text-xs text-green-600 font-medium">Submitted</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
