"use server"

import { revalidatePath } from "next/cache"

import type { Kind } from "@/components/library-preview"
import { slugify } from "@/lib/libraries"
import { createClient } from "@/lib/supabase/server"

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

export async function signInWithDiscord() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { error: "Supabase is not configured. Add keys to .env.local." }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: `${siteUrl()}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  if (data.url) return { url: data.url }
  return { error: "Could not start Discord sign-in." }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
}

export type LibrarySubmissionInput = {
  name: string
  author: string
  platform: string
  kind: Kind
  accent: string
  source: string
  description: string
}

type ActionError = { ok: false; error: string }
type CreateLibraryResult =
  | ActionError
  | { ok: true; libraryId: string; slug: string }

export async function createLibrarySubmission(input: LibrarySubmissionInput): Promise<CreateLibraryResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: "Sign in with Discord to publish." }

  const name = input.name.trim()
  const author = input.author.trim()
  const platform = input.platform.trim()
  const kind = input.kind
  const accent = input.accent.trim()
  const source = input.source.trim()
  const description = input.description.trim()

  if (!name || !author || !platform || !source) {
    return { ok: false, error: "Fill in all required fields." }
  }

  let slug = slugify(name)
  const { data: existing } = await supabase.from("libraries").select("slug").eq("slug", slug).maybeSingle()
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  const { data: library, error: insertError } = await supabase
    .from("libraries")
    .insert({
      slug,
      name,
      author,
      author_id: user.id,
      platform,
      kind,
      accent,
      source_url: source,
      description,
      status: "pending",
    })
    .select("id, slug")
    .single()

  if (insertError || !library) {
    return { ok: false, error: insertError?.message ?? "Failed to create submission." }
  }

  return { ok: true, libraryId: library.id, slug: library.slug }
}

type AttachScreenshotsResult = ActionError | { ok: true }

export async function attachLibraryScreenshots(
  libraryId: string,
  urls: string[],
): Promise<AttachScreenshotsResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: "Sign in with Discord to publish." }
  if (urls.length === 0) return { ok: false, error: "Upload at least one screenshot." }

  const { data: library } = await supabase
    .from("libraries")
    .select("id, author_id, status")
    .eq("id", libraryId)
    .maybeSingle()

  if (!library || library.author_id !== user.id || library.status !== "pending") {
    return { ok: false, error: "Submission not found." }
  }

  const { error: shotsError } = await supabase.from("library_screenshots").insert(
    urls.map((url, sort) => ({
      library_id: libraryId,
      url,
      sort_order: sort,
    })),
  )

  if (shotsError) return { ok: false, error: shotsError.message }

  await supabase.from("libraries").update({ cover_url: urls[0]! }).eq("id", libraryId)

  revalidatePath("/moderation")
  return { ok: true }
}

export async function cancelLibrarySubmission(libraryId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from("libraries")
    .delete()
    .eq("id", libraryId)
    .eq("author_id", user.id)
    .eq("status", "pending")
}

export async function moderateLibrary(libraryId: string, verdict: "approved" | "rejected") {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not signed in." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_moderator")
    .eq("id", user.id)
    .single()

  if (!profile?.is_moderator) return { error: "Moderators only." }

  const { error } = await supabase
    .from("libraries")
    .update({
      status: verdict,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", libraryId)
    .eq("status", "pending")

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/moderation")
  return { ok: true }
}

export async function toggleLike(libraryId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Sign in to like." }

  const { data: existing } = await supabase
    .from("library_likes")
    .select("library_id")
    .eq("library_id", libraryId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("library_likes")
      .delete()
      .eq("library_id", libraryId)
      .eq("user_id", user.id)
    if (error) return { error: error.message }
    return { liked: false }
  }

  const { error } = await supabase.from("library_likes").insert({
    library_id: libraryId,
    user_id: user.id,
  })

  if (error) return { error: error.message }
  return { liked: true }
}

export async function incrementViews(libraryId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("libraries")
    .select("views_count")
    .eq("id", libraryId)
    .single()

  if (!data) return

  await supabase
    .from("libraries")
    .update({ views_count: data.views_count + 1 })
    .eq("id", libraryId)
}
