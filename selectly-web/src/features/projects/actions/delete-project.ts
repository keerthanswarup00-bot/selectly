"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

export async function deleteProject(projectId: string) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false as const, error: "Not authenticated" }
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
    .eq("id", projectId)
    .single<{ studio_id: string }>()

  if (!project) {
    return { success: false as const, error: "Project not found" }
  }

  if (project.studio_id !== profile.studio_id) {
    return { success: false as const, error: "Not authorized" }
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", projectId)

  if (updateError) {
    return { success: false as const, error: updateError.message }
  }

  revalidatePath("/app")
  return { success: true as const }
}
