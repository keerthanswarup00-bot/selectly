"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys } from "@/config/query-keys"

export function useProjects(studioId?: string) {
  return useQuery({
    queryKey: queryKeys.projects.list(studioId ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("studio_id", studioId ?? "")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      return data ?? []
    },
    enabled: !!studioId,
  })
}

export function useProject(id?: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id ?? "")
        .is("deleted_at", null)
        .single()
      return data
    },
    enabled: !!id,
  })
}

export function useProjectStats(studioId?: string) {
  return useQuery({
    queryKey: queryKeys.projects.stats(studioId ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("projects")
        .select("status")
        .eq("studio_id", studioId ?? "")
        .is("deleted_at", null)

      if (!data) {
        return { draft: 0, uploading: 0, selecting: 0, completed: 0, total: 0 }
      }

      const counts = { draft: 0, uploading: 0, selecting: 0, completed: 0, total: data.length }
      for (const p of data) {
        if (p.status === "draft") counts.draft++
        else if (p.status === "uploading" || p.status === "uploaded") counts.uploading++
        else if (p.status === "selecting") counts.selecting++
        else if (p.status === "submitted" || p.status === "completed") counts.completed++
      }
      return counts
    },
    enabled: !!studioId,
  })
}
