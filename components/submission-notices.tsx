import type { UserSubmission } from "@/lib/libraries"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function SubmissionNotices({ submissions }: { submissions: UserSubmission[] }) {
  if (submissions.length === 0) return null

  const pending = submissions.filter((s) => s.status === "pending")
  const rejected = submissions.filter((s) => s.status === "rejected")

  return (
    <div className="mb-8 space-y-3">
      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <p className="text-[13px] font-medium text-amber-500">In review</p>
          <ul className="mt-2 space-y-1 text-[13px] text-muted-foreground">
            {pending.map((item) => (
              <li key={item.id}>
                <span className="text-foreground">{item.name}</span> — waiting for moderator approval
              </li>
            ))}
          </ul>
        </div>
      )}

      {rejected.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[13px] font-medium text-destructive">
              {item.name} was rejected
            </p>
            {item.reviewedAt && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatDate(item.reviewedAt)}
              </span>
            )}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {item.rejectionReason ?? "No reason provided."}
          </p>
        </div>
      ))}
    </div>
  )
}
