import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import type { FixedClient } from "./types"

export function createClient(): FixedClient {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ) as unknown as FixedClient
}
