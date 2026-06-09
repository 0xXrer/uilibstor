import type { Kind } from "@/components/library-preview"
import type { Database, LibraryKind, LibraryStatus } from "@/lib/database.types"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

export type Library = {
  id: string
  slug: string
  name: string
  author: string
  platform: string
  kind: Kind
  accent: string
  likes: number
  views: number
  source: string
  cover?: string
  description: string
  screenshots: string[]
  status: LibraryStatus
  createdAt: string
}

type LibraryRow = Database["public"]["Tables"]["libraries"]["Row"]
type ScreenshotRow = Database["public"]["Tables"]["library_screenshots"]["Row"]

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "library"
}

function mapRow(
  row: LibraryRow,
  screenshots: ScreenshotRow[] = [],
): Library {
  const sorted = [...screenshots].sort((a, b) => a.sort_order - b.sort_order)
  const urls = sorted.map((s) => s.url)

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    author: row.author,
    platform: row.platform,
    kind: row.kind as Kind,
    accent: row.accent,
    likes: row.likes_count,
    views: row.views_count,
    source: row.source_url,
    cover: row.cover_url ?? urls[0],
    description: row.description,
    screenshots: urls,
    status: row.status,
    createdAt: row.created_at,
  }
}

async function attachScreenshots(rows: LibraryRow[]): Promise<Library[]> {
  if (rows.length === 0) return []

  const supabase = await createClient()
  const ids = rows.map((r) => r.id)

  const { data: shots } = await supabase
    .from("library_screenshots")
    .select("*")
    .in("library_id", ids)
    .order("sort_order")

  const byLib = new Map<string, ScreenshotRow[]>()
  for (const s of shots ?? []) {
    const list = byLib.get(s.library_id) ?? []
    list.push(s)
    byLib.set(s.library_id, list)
  }

  return rows.map((row) => mapRow(row, byLib.get(row.id) ?? []))
}

export async function getApprovedLibraries(): Promise<Library[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("libraries")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (error) throw error
  return attachScreenshots(data ?? [])
}

export async function getLibraryBySlug(slug: string): Promise<Library | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("libraries")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { data: shots } = await supabase
    .from("library_screenshots")
    .select("*")
    .eq("library_id", data.id)
    .order("sort_order")

  return mapRow(data, shots ?? [])
}

export async function getPendingLibraries(): Promise<Library[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("libraries")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) throw error
  return attachScreenshots(data ?? [])
}

export async function getGalleryStats() {
  if (!isSupabaseConfigured()) return { libraries: 0, platforms: 0 }
  const supabase = await createClient()

  const { count } = await supabase
    .from("libraries")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")

  const { data: platforms } = await supabase
    .from("libraries")
    .select("platform")
    .eq("status", "approved")

  const uniquePlatforms = new Set((platforms ?? []).map((p) => p.platform))

  return {
    libraries: count ?? 0,
    platforms: uniquePlatforms.size,
  }
}

export async function userLikedLibrary(libraryId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("library_likes")
    .select("library_id")
    .eq("library_id", libraryId)
    .eq("user_id", userId)
    .maybeSingle()

  return !!data
}

export type { LibraryKind, LibraryStatus }
