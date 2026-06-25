"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { signupSchema, type SignupInput } from "@/features/auth/schemas/auth-schema"

function generateSlug(name: string, attempt: number = 0): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  const suffix = Math.random().toString(36).substring(2, 8)
  return attempt === 0 ? `${base}-${suffix}` : `${base}-${suffix}-${attempt}`
}

export async function signup(input: SignupInput) {
  const parsed = signupSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { email, password, studioName } = parsed.data

  // Use admin client for everything to avoid RLS / FK issues:
  // - new users don't have a profile yet (RLS can't resolve them)
  // - the auth user must exist in auth.users before the profiles FK is satisfied
  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return { success: false as const, error: authError.message }
  }

  const userId = authData.user?.id
  if (!userId) {
    return { success: false as const, error: "Failed to create user" }
  }

  // Create studio with slug retry
  let studio: { id: string } | null = null
  let studioError: { message: string } | null = null

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug(studioName, attempt)
    const result = await admin
      .from("studios")
      .insert({ name: studioName, slug })
      .select("id")
      .single<{ id: string }>()

    if (result.data) {
      studio = result.data
      studioError = null
      break
    }
    studioError = result.error
  }

  if (!studio) {
    await cleanupAuthUser(userId)
    return { success: false as const, error: studioError?.message ?? "Failed to create studio" }
  }

  // Create profile for the new user
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    studio_id: studio.id,
    email,
    role: "owner",
  })

  if (profileError) {
    await admin.from("studios").delete().eq("id", studio.id)
    await cleanupAuthUser(userId)
    return { success: false as const, error: profileError.message }
  }

  // Sign in on behalf of the user so they get a session cookie
  const server = await createServerClient()
  const { data: signInData, error: signInError } = await server.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { success: true as const, session: false }
  }

  return { success: true as const, session: !!signInData.session }
}

async function cleanupAuthUser(userId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.auth.admin.deleteUser(userId)
  } catch {
    // best-effort
  }
}
