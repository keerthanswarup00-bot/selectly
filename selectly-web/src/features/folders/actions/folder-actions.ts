"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { createFolderSchema, updateFolderSchema } from "../schemas/folder-schema"

export async function createFolder(formData: FormData) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false as const, error: "Not authenticated" }
  }

  const parsed = createFolderSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("studio_id")
    .eq("id", user.id)
    .single<{ studio_id: string }>()

  if (!profile) {
    return { success: false as const, error: "Profile not found" }
  }

  const { data: project } = await supabase
    .from("projects")
    .select("studio_id")
    .eq("id", parsed.data.projectId)
    .single<{ studio_id: string }>()

  if (!project || project.studio_id !== profile.studio_id) {
    return { success: false as const, error: "Project not found" }
  }

  const { data: maxOrder } = await supabase
    .from("folders")
    .select("sort_order")
    .eq("project_id", parsed.data.projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>()

  const data = parsed.data

  const { data: folder, error: insertError } = await supabase
    .from("folders")
    .insert({
      project_id: data.projectId,
      studio_id: profile.studio_id,
      name: data.name,
      description: data.description || null,
      sort_order: (maxOrder?.sort_order ?? -1) + 1,
      selection_type: data.selectionType,
      min_count: data.selectionType === "no_limit" ? 0 : data.minCount,
      max_count: data.selectionType === "no_limit" ? 0 : data.maxCount,
    })
    .select("id")
    .single<{ id: string }>()

  if (insertError || !folder) {
    return { success: false as const, error: insertError?.message ?? "Failed to create folder" }
  }

  revalidatePath(`/app/project/${data.projectId}`)
  return { success: true as const, data: { id: folder.id } }
}

export async function updateFolder(formData: FormData) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false as const, error: "Not authenticated" }
  }

  const parsed = updateFolderSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { folderId, ...updates } = parsed.data

  const { error } = await supabase
    .from("folders")
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.selectionType !== undefined && { selection_type: updates.selectionType }),
      ...(updates.minCount !== undefined && { min_count: updates.minCount }),
      ...(updates.maxCount !== undefined && { max_count: updates.maxCount }),
      ...(updates.status !== undefined && { status: updates.status }),
    })
    .eq("id", folderId)

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath(`/app/project/[id]`, "layout")
  return { success: true as const }
}

export async function deleteFolder(folderId: string) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false as const, error: "Not authenticated" }
  }

  const { data: folder } = await supabase
    .from("folders")
    .select("project_id")
    .eq("id", folderId)
    .single<{ project_id: string }>()

  if (!folder) {
    return { success: false as const, error: "Folder not found" }
  }

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folderId)

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath(`/app/project/${folder.project_id}`)
  return { success: true as const }
}

export async function toggleFolderShare(folderId: string, enabled: boolean) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false as const, error: "Not authenticated" }
  }

  const { data: folder } = await supabase
    .from("folders")
    .select("project_id")
    .eq("id", folderId)
    .single<{ project_id: string }>()

  if (!folder) {
    return { success: false as const, error: "Folder not found" }
  }

  const { error } = await supabase
    .from("folders")
    .update({ link_disabled: !enabled, status: enabled ? "shared" : "ready" })
    .eq("id", folderId)

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath(`/app/project/${folder.project_id}`)
  return { success: true as const }
}

export async function getFolderLink(folderId: string) {
  const supabase = await createServerClient()

  const { data: folder } = await supabase
    .from("folders")
    .select("link_token, link_disabled, status")
    .eq("id", folderId)
    .single<{ link_token: string; link_disabled: boolean; status: string }>()

  if (!folder) {
    return { success: false as const, error: "Folder not found" }
  }

  return {
    success: true as const,
    data: {
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/client/${folder.link_token}`,
      disabled: folder.link_disabled,
      status: folder.status,
    },
  }
}
