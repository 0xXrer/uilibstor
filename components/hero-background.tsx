"use client"

import * as React from "react"

/** Client-only hero media — avoids hydration mismatch from browser extensions mutating <video>. */
export function HeroBackground() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/hero/telescope-poster.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 -z-20 size-full object-cover"
      />
    )
  }

  return (
    <>
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/hero/telescope-poster.jpg"
        className="absolute inset-0 -z-20 hidden size-full object-cover sm:block"
      >
        <source src="/hero/telescope.webm" type="video/webm" />
        <source src="/hero/telescope.mp4" type="video/mp4" />
      </video>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero/telescope-mobile.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 -z-20 size-full object-cover sm:hidden"
      />
    </>
  )
}
