"use client"

import * as React from "react"
import Link from "next/link"

import { useAuth } from "@/components/auth-provider"
import {
  ACCENT_PRESETS,
  KIND_LABELS,
  LibraryPreview,
  type Kind,
} from "@/components/library-preview"
import { Markdown } from "@/components/markdown"
import { DiscordIcon, SiteHeader } from "@/components/site-header"
import {
  attachLibraryScreenshots,
  cancelLibrarySubmission,
  createLibrarySubmission,
} from "@/lib/actions/libraries"
import { createClient } from "@/lib/supabase/client"

type Shot = { id: string; file: File; url: string; name: string }

const PLATFORMS = ["Luau", "ImGui", "Other"] as const
const KINDS: Kind[] = ["luau", "imgui", "modern"]

function fieldClass() {
  return "w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40"
}

function SignInGate() {
  const { login } = useAuth()
  return (
    <div className="mx-auto flex max-w-md animate-[fade-up_0.5s_ease-out_both] flex-col items-center py-24 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-[#5865F2]/10 text-[#5865F2]">
        <DiscordIcon className="size-6" />
      </span>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Sign in to publish</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
        Uploading a UI library requires a Discord account. We use it to credit
        the author and to keep the archive spam-free.
      </p>
      <button
        type="button"
        onClick={() => login()}
        className="mt-7 flex items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
      >
        <DiscordIcon className="size-4" />
        Continue with Discord
      </button>
    </div>
  )
}

function SubmittedScreen({ name, onReset }: { name: string; onReset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md animate-[scale-in_0.3s_ease-out] flex-col items-center py-24 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Sent for review</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
        <span className="text-foreground">{name || "Your library"}</span> is now
        in the moderation queue. A moderator will approve it before it shows up
        in the gallery.
      </p>
      <div className="mt-7 flex items-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
        >
          Submit another
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium transition-colors hover:bg-muted"
        >
          Back to gallery
        </Link>
      </div>
    </div>
  )
}

export default function UploadPage() {
  const { user, loading } = useAuth()

  const [name, setName] = React.useState("")
  const [author, setAuthor] = React.useState("")
  const [platform, setPlatform] = React.useState<(typeof PLATFORMS)[number]>("Luau")
  const [kind, setKind] = React.useState<Kind>("luau")
  const [accent, setAccent] = React.useState(ACCENT_PRESETS[0]!)
  const [source, setSource] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [descTab, setDescTab] = React.useState<"write" | "preview">("write")
  const [shots, setShots] = React.useState<Shot[]>([])
  const [submitted, setSubmitted] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (user && !author) setAuthor(user.username)
  }, [user, author])

  React.useEffect(() => {
    return () => {
      shots.forEach((s) => URL.revokeObjectURL(s.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addFiles(files: FileList | null) {
    if (!files) return
    const next: Shot[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        url: URL.createObjectURL(f),
        name: f.name,
      }))
    setShots((prev) => [...prev, ...next])
  }

  function removeShot(id: string) {
    setShots((prev) => {
      const target = prev.find((s) => s.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((s) => s.id !== id)
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (shots.length === 0) {
      setError("Upload at least one screenshot.")
      return
    }

    if (!user) {
      setError("Sign in with Discord to publish.")
      return
    }

    setSubmitting(true)

    const result = await createLibrarySubmission({
      name,
      author,
      platform,
      kind,
      accent,
      source,
      description,
    })

    if (!result.ok) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    const { libraryId } = result
    const supabase = createClient()
    if (!supabase) {
      await cancelLibrarySubmission(libraryId)
      setError("Supabase is not configured.")
      setSubmitting(false)
      return
    }

    const uploaded: string[] = []

    try {
      for (let i = 0; i < shots.length; i++) {
        const file = shots[i]!.file
        const ext = file.name.split(".").pop() ?? "jpg"
        const path = `${user.id}/${libraryId}/${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("screenshots")
          .upload(path, file, { upsert: true, contentType: file.type })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        const { data: pub } = supabase.storage.from("screenshots").getPublicUrl(path)
        uploaded.push(pub.publicUrl)
      }
    } catch (err) {
      await cancelLibrarySubmission(libraryId)
      setError(err instanceof Error ? `Upload failed: ${err.message}` : "Upload failed.")
      setSubmitting(false)
      return
    }

    const attached = await attachLibraryScreenshots(libraryId, uploaded)
    if (!attached.ok) {
      await cancelLibrarySubmission(libraryId)
      setError(attached.error)
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  function reset() {
    setName("")
    setSource("")
    setDescription("")
    setDescTab("write")
    setError(null)
    shots.forEach((s) => URL.revokeObjectURL(s.url))
    setShots([])
    setKind("luau")
    setPlatform("Luau")
    setAccent(ACCENT_PRESETS[0]!)
    setSubmitted(false)
  }

  return (
    <div className="min-h-svh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <span className="animate-pulse font-mono text-[13px] text-muted-foreground">Loading session…</span>
          </div>
        ) : !user ? (
          <SignInGate />
        ) : submitted ? (
          <SubmittedScreen name={name} onReset={reset} />
        ) : (
          <div className="animate-[fade-up_0.5s_ease-out_both]">
            <div className="mb-10">
              <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                Upload
              </p>
              <h1 className="mt-2 text-3xl font-medium tracking-tight">Publish a library</h1>
              <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">{user.username}</span>.
                Submissions are reviewed by a moderator before going live.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
              <form onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="accent" value={accent} />

                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Library name</label>
                  <input
                    required
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rayfield"
                    className={fieldClass()}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Author</label>
                    <input
                      required
                      name="author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="your handle"
                      className={fieldClass()}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Platform</label>
                    <select
                      name="platform"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as (typeof PLATFORMS)[number])}
                      className={fieldClass()}
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Preview style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {KINDS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        aria-pressed={kind === k}
                        className={`rounded-lg border px-2 py-2 text-[12px] font-medium transition-colors ${
                          kind === k
                            ? "border-foreground/40 bg-muted text-foreground"
                            : "border-border text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        {KIND_LABELS[k]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Accent</label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAccent(c)}
                        aria-label={`accent ${c}`}
                        aria-pressed={accent === c}
                        className={`size-7 rounded-full ring-offset-2 ring-offset-background transition-all ${
                          accent === c ? "ring-2 ring-foreground" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Source URL</label>
                  <input
                    required
                    name="source"
                    type="url"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="https://github.com/you/library"
                    className={fieldClass()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Screenshots</label>
                  <label
                    htmlFor="shots"
                    className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center transition-colors hover:border-foreground/40 hover:bg-muted/40"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-muted-foreground">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="8.5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M5 17l4.5-4 3 2.5L16 12l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[13px] font-medium">Drop images or click to upload</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      PNG / JPG / WEBP — how your menu actually looks
                    </span>
                  </label>
                  <input
                    id="shots"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                  {shots.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-4">
                      {shots.map((s) => (
                        <div key={s.id} className="group/shot relative overflow-hidden rounded-lg border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.url} alt={s.name} className="aspect-[4/3] w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeShot(s.id)}
                            aria-label="Remove image"
                            className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover/shot:opacity-100"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-medium">Description</label>
                    <div className="flex rounded-md border border-border p-0.5 text-[11px] font-medium">
                      <button
                        type="button"
                        onClick={() => setDescTab("write")}
                        className={`rounded px-2 py-0.5 transition-colors ${
                          descTab === "write" ? "bg-muted text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescTab("preview")}
                        className={`rounded px-2 py-0.5 transition-colors ${
                          descTab === "preview" ? "bg-muted text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                  {descTab === "write" ? (
                    <textarea
                      name="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={8}
                      placeholder={"## My library\n\nSupports **markdown** — headings, lists, `code`, links.\n\n- Feature one\n- Feature two"}
                      className={`${fieldClass()} resize-y font-mono text-[13px] leading-relaxed`}
                    />
                  ) : (
                    <div className="min-h-[12rem] rounded-lg border border-border px-4 py-2">
                      {description.trim() ? (
                        <Markdown>{description}</Markdown>
                      ) : (
                        <p className="py-8 text-center font-mono text-[12px] text-muted-foreground">
                          Nothing to preview yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                    {error}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Uploading…" : "Submit for review"}
                  </button>
                  <Link
                    href="/"
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Cancel
                  </Link>
                </div>
              </form>

              <div className="lg:sticky lg:top-20 lg:self-start">
                <p className="mb-3 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                  Live preview
                </p>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-[#0b0b0c]">
                  {shots[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shots[0].url} alt="cover" className="size-full object-cover" />
                  ) : (
                    <LibraryPreview kind={kind} accent={accent} name={name || "Untitled"} />
                  )}
                  <span className="absolute top-3 left-3 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] tracking-tight text-white/70 backdrop-blur-sm">
                    {platform}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="grid size-5 place-items-center rounded-full text-[9px] font-medium text-black"
                    style={{ backgroundColor: accent }}
                  >
                    {(author || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <div className="leading-tight">
                    <p className="text-[13px] font-medium tracking-tight">{name || "Untitled"}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{author || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
