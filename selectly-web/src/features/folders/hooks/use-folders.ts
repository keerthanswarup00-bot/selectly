"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { queryKeys } from "@/config/query-keys"
import type { FolderRow, ImageRow } from "@/types/database"
import { createFolder, updateFolder, deleteFolder, toggleFolderShare } from "../actions/folder-actions"

export function useFolders(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.folders.list(projectId ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("folders")
        .select("*")
        .eq("project_id", projectId ?? "")
        .order("sort_order", { ascending: true })
      return (data ?? []) as FolderRow[]
    },
    enabled: !!projectId,
  })
}

export function useFolder(folderId?: string) {
  return useQuery({
    queryKey: queryKeys.folders.detail(folderId ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("folders")
        .select("*")
        .eq("id", folderId ?? "")
        .single<FolderRow>()
      return data
    },
    enabled: !!folderId,
  })
}

export function useFolderImages(folderId?: string) {
  return useQuery({
    queryKey: queryKeys.images.list(folderId ?? ""),
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("project_images")
        .select("*")
        .eq("folder_id", folderId ?? "")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      return (data ?? []) as ImageRow[]
    },
    enabled: !!folderId,
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createFolder(formData)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, formData) => {
      const projectId = formData.get("projectId") as string
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.list(projectId) })
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await updateFolder(formData)
      if (!result.success) throw new Error(result.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (folderId: string) => {
      const result = await deleteFolder(folderId)
      if (!result.success) throw new Error(result.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}

export function useToggleFolderShare() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ folderId, enabled }: { folderId: string; enabled: boolean }) => {
      const result = await toggleFolderShare(folderId, enabled)
      if (!result.success) throw new Error(result.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}
