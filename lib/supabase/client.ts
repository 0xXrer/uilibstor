import { type SupabaseClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "@/lib/database.types"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export function createClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
