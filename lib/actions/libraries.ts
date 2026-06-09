"use server"

import { revalidatePath } from "next/cache"

import type { Kind } from "@/components/library-preview"
import { slugify } from "@/lib/libraries"
import { createClient } from "@/lib/supabase/server"

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

export async function signInWithDiscord() {
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

export async function submitLibrary(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Sign in with Discord to publish." }

  const name = String(formData.get("name") ?? "").trim()
  const author = String(formData.get("author") ?? "").trim()
  const platform = String(formData.get("platform") ?? "").trim()
  const kind = String(formData.get("kind") ?? "luau") as Kind
  const accent = String(formData.get("accent") ?? "").trim()
  const source = String(formData.get("source") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()

  if (!name || !author || !platform || !source) {
    return { error: "Fill in all required fields." }
  }

  const files = formData.getAll("screenshots").filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) {
    return { error: "Upload at least one screenshot." }
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
    return { error: insertError?.message ?? "Failed to create submission." }
  }

  const uploaded: { url: string; sort: number }[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `${user.id}/${library.id}/${i}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("screenshots")
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      return { error: `Upload failed: ${uploadError.message}` }
    }

    const { data: pub } = supabase.storage.from("screenshots").getPublicUrl(path)
    uploaded.push({ url: pub.publicUrl, sort: i })
  }

  const { error: shotsError } = await supabase.from("library_screenshots").insert(
    uploaded.map((u) => ({
      library_id: library.id,
      url: u.url,
      sort_order: u.sort,
    })),
  )

  if (shotsError) return { error: shotsError.message }

  await supabase
    .from("libraries")
    .update({ cover_url: uploaded[0]!.url })
    .eq("id", library.id)

  revalidatePath("/moderation")
  return { ok: true, slug: library.slug }
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
