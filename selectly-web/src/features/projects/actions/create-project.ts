"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { createProjectSchema } from "@/features/projects/schemas/project-schema"

export async function createProject(formData: FormData) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false as const, error: "Not authenticated" }
  }

  const parsed = createProjectSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { clientName, eventDate, targetCount } = parsed.data

  const { data: profile } = await supabase
    .from("profiles")
    .select("studio_id")
    .eq("id", user.id)
    .single<{ studio_id: string }>()

  if (!profile) {
    return { success: false as const, error: "Profile not found" }
  }

  const minCount = Math.round(targetCount * 0.8)
  const maxCount = Math.round(targetCount * 1.2)

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({
      studio_id: profile.studio_id,
      created_by: user.id,
      client_name: clientName,
      event_date: eventDate,
      target_count: targetCount,
      min_count: minCount,
      max_count: maxCount,
    })
    .select("id")
    .single<{ id: string }>()

  if (insertError || !project) {
    return { success: false as const, error: insertError?.message ?? "Failed to create project" }
  }

  try {
    await supabase.from("activity_logs").insert({
      studio_id: profile.studio_id,
      profile_id: user.id,
      action: "project.created",
      resource_type: "project",
      resource_id: project.id,
      metadata: { client_name: clientName },
    })
  } catch {
    // Activity log is non-critical; don't block the response
  }

  revalidatePath("/app")
  return { success: true as const, data: { id: project.id } }
}
