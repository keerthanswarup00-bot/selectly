"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys } from "@/config/query-keys"

export function useDashboardStats(studioId?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(studioId ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data: profile } = await supabase
        .from("profiles")
        .select("studio_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .single()

      if (!profile?.studio_id) return null

      const { data: projects } = await supabase
        .from("projects")
        .select("id, client_name, status, total_images, created_at")
        .eq("studio_id", profile.studio_id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      const stats = { draft: 0, uploading: 0, selecting: 0, completed: 0, total: 0 }
      if (projects) {
        stats.total = projects.length
        for (const p of projects) {
          if (p.status === "draft") stats.draft++
          else if (p.status === "uploading" || p.status === "uploaded") stats.uploading++
          else if (p.status === "selecting") stats.selecting++
          else if (p.status === "submitted" || p.status === "completed") stats.completed++
        }
      }

      return { stats, recentProjects: projects?.slice(0, 5) ?? [] }
    },
    enabled: !!studioId,
  })
}
