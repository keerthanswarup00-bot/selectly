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
    const admin = createAdminClient()

    // Step 1: create + confirm auth user (admin client — guaranteed to exist in auth.users)
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      return { success: false as const, error: createError.message }
    }

    const userId = userData.user?.id
    if (!userId) {
      return { success: false as const, error: "Failed to create user" }
    }

    // Step 2: create studio
    let studio: { id: string } | null = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = generateSlug(studioName, attempt)
      const { data, error } = await admin
        .from("studios")
        .insert({ name: studioName, slug })
        .select("id")
        .single<{ id: string }>()

      if (data) { studio = data; break }
      if (attempt === 4) {
        await cleanupAuthUser(userId)
        return { success: false as const, error: error?.message ?? "Failed to create studio" }
      }
    }

    // Step 3: create profile
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

    // Step 4: sign in with the anon-key client (not admin)
    const server = await createServerClient()
    const { data: signInData, error: signInError } = await server.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !signInData?.session) {
      return { success: false as const, error: signInError?.message ?? "Failed to sign in" }
    }

    // Return session to the client so it can set it in the browser Supabase client
    return {
      success: true as const,
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
    }

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
