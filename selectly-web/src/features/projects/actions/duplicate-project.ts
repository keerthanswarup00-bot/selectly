"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

export async function duplicateProject(projectId: string) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false as const, error: "Not authenticated" }
  }

  const { data: rawProject, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single()

  if (projectError || !rawProject) {
    return { success: false as const, error: "Project not found" }
  }

  const project = rawProject as {
    studio_id: string
    client_name: string
    event_date: string | null
    target_count: number
    min_count: number
    max_count: number
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("studio_id")
    .eq("id", user.id)
    .single<{ studio_id: string }>()

  if (!profile || project.studio_id !== profile.studio_id) {
    return { success: false as const, error: "Not authorized" }
  }

  const { data: newProject, error: insertError } = await supabase
    .from("projects")
    .insert({
      studio_id: project.studio_id,
      created_by: user.id,
      client_name: `${project.client_name} (Copy)`,
      event_date: project.event_date,
      target_count: project.target_count,
      min_count: project.min_count,
      max_count: project.max_count,
      status: "draft",
    })
    .select("id")
    .single<{ id: string }>()

  if (insertError || !newProject) {
    return { success: false as const, error: insertError?.message ?? "Failed to duplicate project" }
  }

  try {
    await supabase.from("activity_logs").insert({
      studio_id: profile.studio_id,
      profile_id: user.id,
      action: "project.created",
      resource_type: "project",
      resource_id: newProject.id,
      metadata: { client_name: project.client_name, duplicated_from: projectId },
    })
  } catch {}

  revalidatePath("/app")
  return { success: true as const, data: { id: newProject.id } }
}
