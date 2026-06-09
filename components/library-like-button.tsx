"use client"

import * as React from "react"

import { toggleLike } from "@/lib/actions/libraries"

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function LibraryLikeButton({
  libraryId,
  initialLikes,
  initialLiked,
}: {
  libraryId: string
  initialLikes: number
  initialLiked: boolean
}) {
  const [liked, setLiked] = React.useState(initialLiked)
  const [likes, setLikes] = React.useState(initialLikes)
  const [pending, setPending] = React.useState(false)

  async function handleClick() {
    if (pending) return
    setPending(true)

    const result = await toggleLike(libraryId)
    if ("error" in result && result.error) {
      alert(result.error)
    } else if ("liked" in result && typeof result.liked === "boolean") {
      setLiked(result.liked)
      setLikes((n) => n + (result.liked ? 1 : -1))
    }

    setPending(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
        liked
          ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
          : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill={liked ? "currentColor" : "none"} aria-hidden>
        <path d="M8 13.5S2 10 2 5.8A3 3 0 0 1 8 4a3 3 0 0 1 6 1.8C14 10 8 13.5 8 13.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
      {formatCount(likes)}
    </button>
  )
}
