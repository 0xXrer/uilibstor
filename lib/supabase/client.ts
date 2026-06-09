import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "@/lib/database.types"
import { requireSupabaseEnv } from "@/lib/supabase/env"

export function createClient() {
  requireSupabaseEnv()
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
