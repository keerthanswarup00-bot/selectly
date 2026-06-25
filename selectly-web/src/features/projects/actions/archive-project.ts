"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

export async function archiveProject(projectId: string) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false as const, error: "Not authenticated" }
  }

  const { data: project } = await supabase
    .from("projects")
    .select("studio_id")
    .eq("id", projectId)
    .single<{ studio_id: string }>()

  if (!project) {
    return { success: false as const, error: "Project not found" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("studio_id")
    .eq("id", user.id)
    .single<{ studio_id: string }>()

  if (!profile || project.studio_id !== profile.studio_id) {
    return { success: false as const, error: "Not authorized" }
  }

  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", projectId)

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath("/app")
  return { success: true as const }
}

export async function restoreProject(projectId: string) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false as const, error: "Not authenticated" }
  }

  const { data: project } = await supabase
    .from("projects")
    .select("studio_id")
    .eq("id", projectId)
    .single<{ studio_id: string }>()

  if (!project) {
    return { success: false as const, error: "Project not found" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("studio_id")
    .eq("id", user.id)
    .single<{ studio_id: string }>()

  if (!profile || project.studio_id !== profile.studio_id) {
    return { success: false as const, error: "Not authorized" }
  }

  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: null })
    .eq("id", projectId)

  if (error) {
    return { success: false as const, error: error.message }
  }

  revalidatePath("/app")
  return { success: true as const }
}
