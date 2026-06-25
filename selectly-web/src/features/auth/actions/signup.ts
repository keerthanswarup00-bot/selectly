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
  try {
    const parsed = signupSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.errors[0]?.message ?? "Invalid input" }
    }

    const { email, password, studioName } = parsed.data

    // Step 1: create auth user via the standard anon-key endpoint (reliable)
    const server = await createServerClient()
    const { data: authData, error: authError } = await server.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return { success: false as const, error: authError.message }
    }

    const userId = authData.user?.id
    if (!userId) {
      return { success: false as const, error: "Failed to create user" }
    }

    // Step 2: confirm the user (admin client — best-effort, may fail if
    // SUPABASE_SERVICE_ROLE_KEY is missing or the admin API is restricted)
    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(userId, { email_confirm: true }).catch(() => {})

    // Step 3: create studio + profile (admin client — bypasses RLS)
    let studio: { id: string } | null = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = generateSlug(studioName, attempt)
      const { data, error } = await admin
        .from("studios")
        .insert({ name: studioName, slug })
        .select("id")
        .maybeSingle<{ id: string }>()

      if (data) { studio = data; break }
      if (attempt === 4) {
        await cleanupAuthUser(userId)
        return { success: false as const, error: error?.message ?? "Failed to create studio" }
      }
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      studio_id: studio!.id,
      email,
      role: "owner",
    })

    if (profileError) {
      await admin.from("studios").delete().eq("id", studio!.id)
      await cleanupAuthUser(userId)
      return { success: false as const, error: profileError.message }
    }

    // Step 4: sign in — this writes the session cookies via the SSR client
    const { error: signInError } = await server.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return { success: false as const, error: signInError.message }
    }

    return { success: true as const }

  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong"
    return { success: false as const, error: message }
  }
}

async function cleanupAuthUser(userId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.auth.admin.deleteUser(userId)
  } catch {
    // best-effort
  }
}
