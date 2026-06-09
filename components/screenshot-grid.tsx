"use client"

import * as React from "react"

export function ScreenshotGrid({
  screenshots,
  name,
}: {
  screenshots: string[]
  name: string
}) {
  const [lightbox, setLightbox] = React.useState<string | null>(null)

  if (screenshots.length === 0) {
    return (
      <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-8 text-center font-mono text-[12px] text-muted-foreground">
        No screenshots uploaded yet.
      </p>
    )
  }

  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {screenshots.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setLightbox(src)}
            className="overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${name} screenshot ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
          </button>
        ))}
      </div>

      {lightbox && (
        <button
          type="button"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex animate-[fade-in_0.15s_ease-out] items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-xl" />
        </button>
      )}
    </>
  )
}
