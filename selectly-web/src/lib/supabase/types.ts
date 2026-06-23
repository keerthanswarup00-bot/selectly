import type { Database } from "@/types/database"
import type { SupabaseClient, PostgrestQueryBuilder } from "@supabase/supabase-js"

type Schema = Database["public"]
type Tables = Schema["Tables"]

export interface FixedClient extends SupabaseClient<Database> {
  from<T extends string & keyof Tables>(
    relation: T,
  ): PostgrestQueryBuilder<{ PostgrestVersion: "12" }, Schema, Tables[T], T>
}
