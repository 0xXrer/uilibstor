"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"

import {
  ACCENT_PRESETS,
  KIND_LABELS,
  type Kind,
} from "@/components/library-preview"
import { Markdown } from "@/components/markdown"
import {
  moderateLibrary,
  updatePendingLibrary,
  type PendingLibraryEdit,
} from "@/lib/actions/libraries"
import type { Library } from "@/lib/libraries"

const PLATFORMS = ["Luau", "ImGui", "Other"] as const
const KINDS: Kind[] = ["luau", "imgui", "modern"]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} d ago`
}

function fieldClass() {
  return "w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40"
}

type ReviewModalProps = {
  item: Library
  mode: "view" | "edit"
  pending: boolean
  onClose: () => void
  onSaved: (item: Library) => void
  onDecide: (id: string, verdict: "approved" | "rejected", reason?: string) => Promise<void>
}

function ReviewModal({ item, mode: initialMode, pending, onClose, onSaved, onDecide }: ReviewModalProps) {
  const [mode, setMode] = React.useState(initialMode)
  const [saving, setSaving] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState("")
  const [rejectError, setRejectError] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<PendingLibraryEdit>({
    name: item.name,
    author: item.author,
    platform: item.platform,
    kind: item.kind,
    accent: item.accent,
    source: item.source,
    description: item.description,
  })
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose, pending])

  React.useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  async function saveEdit() {
    setSaving(true)
    const result = await updatePendingLibrary(item.id, form)
    setSaving(false)
    if (result.error) {
      alert(result.error)
      return
    }
    onSaved({ ...item, ...form, source: form.source })
    setMode("view")
  }

  async function confirmReject() {
    const reason = rejectReason.trim()
    if (!reason) {
      setRejectError("Write a reason so the author knows what to fix.")
      return
    }
    setRejectError(null)
    await onDecide(item.id, "rejected", reason)
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={() => !pending && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        className="relative z-10 flex max-h-[min(90svh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-[scale-in_0.2s_ease-out]"
      >
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
              {mode === "edit" ? "Edit submission" : "Preview submission"}
            </p>
            <h2 id="review-modal-title" className="mt-1 truncate text-xl font-medium tracking-tight">
              {mode === "edit" ? form.name : item.name}
            </h2>
            <p className="font-mono text-[11px] text-muted-foreground">
              by {item.author} · {timeAgo(item.createdAt)} · {item.platform}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {mode === "edit" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[13px] font-medium">Library name</label>
                <input
                  className={fieldClass()}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium">Author</label>
                <input
                  className={fieldClass()}
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium">Platform</label>
                <select
                  className={fieldClass()}
                  value={form.platform}
                  onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium">Kind</label>
                <select
                  className={fieldClass()}
                  value={form.kind}
                  onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as Kind }))}
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium">Source URL</label>
                <input
                  className={fieldClass()}
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[13px] font-medium">Accent</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, accent: color }))}
                      className="size-7 rounded-full border-2 transition-transform hover:scale-105"
                      style={{
                        backgroundColor: color,
                        borderColor: form.accent === color ? "var(--foreground)" : "transparent",
                      }}
                      aria-label="Pick accent"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[13px] font-medium">Description</label>
                <textarea
                  className={fieldClass() + " min-h-[160px] resize-y"}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_220px]">
              <div>
                {item.cover ? (
                  <div className="overflow-hidden rounded-xl border border-border bg-[#0b0b0c]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.cover}
                      alt={`${item.name} cover`}
                      className="aspect-[16/10] w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid aspect-[16/10] place-items-center rounded-xl border border-border bg-[#0b0b0c] font-mono text-[12px] text-muted-foreground">
                    No cover image
                  </div>
                )}

                {item.screenshots.length > 0 && (
                  <section className="mt-8">
                    <h3 className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                      Screenshots ({item.screenshots.length})
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {item.screenshots.map((url, i) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-lg border border-border bg-[#0b0b0c] transition-opacity hover:opacity-90"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`${item.name} screenshot ${i + 1}`}
                            className="aspect-[4/3] w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mt-8">
                  <h3 className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                    About
                  </h3>
                  {item.description.trim() ? (
                    <Markdown className="mt-2">{item.description}</Markdown>
                  ) : (
                    <p className="mt-3 text-[14px] text-muted-foreground">No description provided.</p>
                  )}
                </section>
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl border border-border p-4 text-[13px]">
                  <dl className="space-y-3">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Kind</dt>
                      <dd className="font-medium">{KIND_LABELS[item.kind]}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Platform</dt>
                      <dd className="font-medium">{item.platform}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Author</dt>
                      <dd className="font-medium">{item.author}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                    <span className="size-3 rounded-full" style={{ backgroundColor: item.accent }} />
                    <span className="font-mono text-[11px] text-muted-foreground">accent</span>
                  </div>
                </div>

                <a
                  href={item.source}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[13px] font-medium transition-colors hover:bg-muted"
                >
                  Open source
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </aside>
            </div>
          )}

          {rejectOpen && (
            <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-[13px] font-medium text-destructive">Rejection reason</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                The author will see this on their upload page.
              </p>
              <textarea
                autoFocus
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value)
                  setRejectError(null)
                }}
                placeholder="Explain what needs to change…"
                className={fieldClass() + " mt-3 min-h-[100px] resize-y"}
              />
              {rejectError && (
                <p className="mt-2 text-[12px] text-destructive">{rejectError}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void confirmReject()}
                  className="rounded-lg bg-destructive px-3 py-1.5 text-[13px] font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Confirm reject
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setRejectOpen(false)
                    setRejectReason("")
                    setRejectError(null)
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-[13px] transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {mode === "view" ? (
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveEdit()}
                  className="rounded-lg bg-foreground px-3 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setForm({
                      name: item.name,
                      author: item.author,
                      platform: item.platform,
                      kind: item.kind,
                      accent: item.accent,
                      source: item.source,
                      description: item.description,
                    })
                    setMode("view")
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-[13px] transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Cancel edit
                </button>
              </>
            )}
          </div>

          {!rejectOpen && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending || mode === "edit"}
                onClick={() => void onDecide(item.id, "approved")}
                className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-[13px] font-medium text-emerald-500 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={pending || mode === "edit"}
                onClick={() => setRejectOpen(true)}
                className="rounded-lg bg-destructive/10 px-3 py-1.5 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ReviewCard({
  item,
  index,
  pending,
  onOpen,
}: {
  item: Library
  index: number
  pending: string | null
  onOpen: (item: Library, mode: "view" | "edit") => void
}) {
  return (
    <article
      className="grid animate-[fade-up_0.45s_ease-out_both] grid-cols-1 gap-5 rounded-xl border border-border p-4 transition-colors hover:border-foreground/20 sm:grid-cols-[220px_1fr]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <button
        type="button"
        onClick={() => onOpen(item, "view")}
        className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-[#0b0b0c] text-left"
      >
        {item.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.cover}
            alt={item.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid size-full place-items-center font-mono text-[11px] text-muted-foreground">
            no cover
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 font-mono text-[11px] text-white opacity-0 transition-all group-hover:bg-black/45 group-hover:opacity-100">
          Open preview
        </span>
        <span className="absolute top-2 left-2 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[9px] text-white/80 backdrop-blur-sm">
          {item.screenshots.length} shots
        </span>
      </button>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpen(item, "view")}
            className="min-w-0 text-left"
          >
            <h3 className="text-[16px] font-medium tracking-tight transition-colors hover:text-foreground/80">
              {item.name}
            </h3>
            <p className="font-mono text-[11px] text-muted-foreground">
              by {item.author} · {timeAgo(item.createdAt)}
            </p>
          </button>
          <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-500">
            pending
          </span>
        </div>

        {item.description.trim() && (
          <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {item.description.replace(/[#*`]/g, "").slice(0, 180)}
          </p>
        )}

        <a
          href={item.source}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-flex w-fit items-center gap-1 font-mono text-[11px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {item.source.replace(/^https?:\/\//, "")}
        </a>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <button
            type="button"
            disabled={pending === item.id}
            onClick={() => onOpen(item, "view")}
            className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            Preview
          </button>
          <button
            type="button"
            disabled={pending === item.id}
            onClick={() => onOpen(item, "edit")}
            className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            Edit
          </button>
        </div>
      </div>
    </article>
  )
}

export function ModerationQueue({ initialQueue }: { initialQueue: Library[] }) {
  const router = useRouter()
  const [queue, setQueue] = React.useState(initialQueue)
  const [approved, setApproved] = React.useState(0)
  const [rejected, setRejected] = React.useState(0)
  const [pending, setPending] = React.useState<string | null>(null)
  const [active, setActive] = React.useState<{ item: Library; mode: "view" | "edit" } | null>(null)

  async function decide(id: string, verdict: "approved" | "rejected", reason?: string) {
    setPending(id)
    const result = await moderateLibrary(id, verdict, reason)
    if (result.error) {
      alert(result.error)
      setPending(null)
      return
    }
    setQueue((prev) => prev.filter((s) => s.id !== id))
    if (verdict === "approved") setApproved((n) => n + 1)
    else setRejected((n) => n + 1)
    setPending(null)
    setActive(null)
    router.refresh()
  }

  function openItem(item: Library, mode: "view" | "edit") {
    setActive({ item, mode })
  }

  function updateItem(updated: Library) {
    setQueue((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    setActive((current) => (current?.item.id === updated.id ? { ...current, item: updated } : current))
  }

  return (
    <div className="animate-[fade-up_0.5s_ease-out_both]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            Moderation
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight">Review queue</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Click a submission to preview. Edit details or reject with a reason for the author.
          </p>
        </div>
        <div className="flex gap-6 font-mono text-[11px] text-muted-foreground">
          <div className="flex flex-col">
            <span className="text-[20px] font-medium leading-none text-foreground tabular-nums">
              {queue.length}
            </span>
            pending
          </div>
          <div className="flex flex-col">
            <span className="text-[20px] font-medium leading-none text-emerald-500 tabular-nums">
              {approved}
            </span>
            approved
          </div>
          <div className="flex flex-col">
            <span className="text-[20px] font-medium leading-none text-destructive tabular-nums">
              {rejected}
            </span>
            rejected
          </div>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="flex animate-[scale-in_0.3s_ease-out] flex-col items-center rounded-xl border border-dashed border-border py-20 text-center">
          <span className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="mt-4 text-[14px] font-medium">Queue cleared</p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Nothing left to review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item, i) => (
            <ReviewCard
              key={item.id}
              item={item}
              index={i}
              pending={pending}
              onOpen={openItem}
            />
          ))}
        </div>
      )}

      {active && (
        <ReviewModal
          item={active.item}
          mode={active.mode}
          pending={pending === active.item.id}
          onClose={() => setActive(null)}
          onSaved={updateItem}
          onDecide={decide}
        />
      )}
    </div>
  )
}
