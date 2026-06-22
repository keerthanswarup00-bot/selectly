"use server"

import { createServerClient_ } from "@/lib/supabase/server"
import { loginSchema, type LoginInput } from "@/features/auth/schemas/auth-schema"

export async function login(input: LoginInput) {
  const parsed = loginSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message }
  }

  const { email, password } = parsed.data
  const supabase = await createServerClient_()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false as const, error: error.message }
  }

  return { success: true as const }
}
