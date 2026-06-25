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

  const { clientName, eventDate, notes } = parsed.data

  const { data: profile } = await supabase
    .from("profiles")
    .select("studio_id")
    .eq("id", user.id)
    .single<{ studio_id: string }>()

  if (!profile) {
    return { success: false as const, error: "Profile not found" }
  }

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({
      studio_id: profile.studio_id,
      created_by: user.id,
      client_name: clientName,
      event_date: eventDate || null,
      notes: notes || null,
    })
    .select("id")
    .single<{ id: string }>()

  if (insertError || !project) {
    return { success: false as const, error: insertError?.message ?? "Failed to create project" }
  }

  revalidatePath("/app")
  return { success: true as const, data: { id: project.id } }
}
