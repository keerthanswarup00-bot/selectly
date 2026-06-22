"use server"

import { createServerClient_ } from "@/lib/supabase/server"
import { signupSchema, type SignupInput } from "@/features/auth/schemas/auth-schema"

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${suffix}`
}

export async function signup(input: SignupInput) {
  const parsed = signupSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message }
  }

  const { email, password, studioName } = parsed.data
  const supabase = await createServerClient_()

  const slug = generateSlug(studioName)

  const { data: studio, error: studioError } = await supabase
    .from("studios")
    .insert({ name: studioName, slug })
    .select("id")
    .single()

  if (studioError) {
    return { success: false as const, error: studioError.message }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    await supabase.from("studios").delete().eq("id", studio.id)
    return { success: false as const, error: authError.message }
  }

  const userId = authData.user?.id
  if (!userId) {
    await supabase.from("studios").delete().eq("id", studio.id)
    return { success: false as const, error: "Failed to create user" }
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    studio_id: studio.id,
    email,
    role: "owner",
  })

  if (profileError) {
    await supabase.from("studios").delete().eq("id", studio.id)
    return { success: false as const, error: profileError.message }
  }

  return { success: true as const }
}
