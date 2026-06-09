"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import type { Library } from "@/lib/libraries"
import { moderateLibrary } from "@/lib/actions/libraries"

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} d ago`
}

function ReviewCard({
  item,
  index,
  onDecide,
  pending,
}: {
  item: Library
  index: number
  onDecide: (id: string, verdict: "approved" | "rejected") => void
  pending: string | null
}) {
  return (
    <div
      className="grid animate-[fade-up_0.45s_ease-out_both] grid-cols-1 gap-5 rounded-xl border border-border p-4 sm:grid-cols-[200px_1fr]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-[#0b0b0c]">
        {item.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover} alt={item.name} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center font-mono text-[11px] text-muted-foreground">
            no cover
          </div>
        )}
        <span className="absolute top-2 left-2 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white/70 backdrop-blur-sm">
          {item.platform}
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-medium tracking-tight">{item.name}</h3>
            <p className="font-mono text-[11px] text-muted-foreground">
              by {item.author} · {timeAgo(item.createdAt)}
            </p>
          </div>
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            pending
          </span>
        </div>

        {item.description.trim() && (
          <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
            {item.description.replace(/[#*`]/g, "").slice(0, 200)}
          </p>
        )}

        <a
          href={item.source}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex w-fit items-center gap-1 font-mono text-[11px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {item.source.replace(/^https?:\/\//, "")}
        </a>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <button
            type="button"
            disabled={pending === item.id}
            onClick={() => onDecide(item.id, "approved")}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-[13px] font-medium text-emerald-500 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={pending === item.id}
            onClick={() => onDecide(item.id, "rejected")}
            className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

export function ModerationQueue({ initialQueue }: { initialQueue: Library[] }) {
  const router = useRouter()
  const [queue, setQueue] = React.useState(initialQueue)
  const [approved, setApproved] = React.useState(0)
  const [rejected, setRejected] = React.useState(0)
  const [pending, setPending] = React.useState<string | null>(null)

  async function decide(id: string, verdict: "approved" | "rejected") {
    setPending(id)
    const result = await moderateLibrary(id, verdict)
    if (result.error) {
      alert(result.error)
      setPending(null)
      return
    }
    setQueue((prev) => prev.filter((s) => s.id !== id))
    if (verdict === "approved") setApproved((n) => n + 1)
    else setRejected((n) => n + 1)
    setPending(null)
    router.refresh()
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
            Approve or reject community submissions before they go live.
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
              onDecide={decide}
              pending={pending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
