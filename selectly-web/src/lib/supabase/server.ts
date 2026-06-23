import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"
import type { FixedClient } from "./types"
import type { SetAllCookies } from "@supabase/ssr/dist/module/types"

export async function createServerClient(): Promise<FixedClient> {
  const cookieStore = await cookies()
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll: ((cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        }) satisfies SetAllCookies,
      },
    },
  ) as unknown as FixedClient
}
