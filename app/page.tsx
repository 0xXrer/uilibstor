import Link from "next/link"
import type { Metadata } from "next"

import { Gallery } from "@/components/gallery"
import { HeroBackground } from "@/components/hero-background"
import { SiteHeader } from "@/components/site-header"
import { getApprovedLibraries, getGalleryStats } from "@/lib/libraries"
import { SITE_NAME } from "@/lib/metadata"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "The menu, before the build.",
  description:
    "Community gallery of UI libraries for Roblox and ImGui overlays. Browse the real look, grab the source.",
  openGraph: {
    title: `The menu, before the build. · ${SITE_NAME}`,
    description:
      "Community gallery of UI libraries for Roblox and ImGui overlays. Browse the real look, grab the source.",
    url: "/",
    images: [
      {
        url: "/hero/telescope-poster.jpg",
        width: 1920,
        height: 1080,
        alt: "uilib gallery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `The menu, before the build. · ${SITE_NAME}`,
    description:
      "Community gallery of UI libraries for Roblox and ImGui overlays. Browse the real look, grab the source.",
    images: ["/hero/telescope-poster.jpg"],
  },
  alternates: {
    canonical: "/",
  },
}

export default async function Page() {
  const [libraries, stats] = await Promise.all([
    getApprovedLibraries(),
    getGalleryStats(),
  ])

  return (
    <div className="min-h-svh">
      <SiteHeader />

      <section className="relative isolate flex min-h-[80svh] flex-col items-center justify-center overflow-hidden border-b border-border bg-[#070708]">
        <HeroBackground />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#070708]/55 via-[#070708]/25 to-[#070708]" />

        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-24 text-center sm:px-10">
          <h1
            className="animate-[fade-up_0.7s_ease-out_both] text-[2.5rem] font-medium leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            The menu, before the build.
          </h1>

          <p
            className="mx-auto mt-6 max-w-[42ch] animate-[fade-up_0.7s_ease-out_both] text-[14px] leading-relaxed text-white/55 sm:text-[15px]"
            style={{ animationDelay: "160ms" }}
          >
            Community gallery of UI libs for Roblox and ImGui overlays.
            Browse the real look, grab the source.
          </p>

          <div
            className="mt-9 flex animate-[fade-up_0.7s_ease-out_both] items-center gap-4"
            style={{ animationDelay: "240ms" }}
          >
            <a
              href="#gallery"
              className="rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-black transition-opacity hover:opacity-90"
            >
              Browse all
            </a>
            <Link
              href="/upload"
              className="rounded-lg bg-white/1 px-4 py-2 flex items-center gap-1.5 text-[13px] text-white/55 transition-colors hover:text-white"
            >
              Publish yours
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div
            className="mt-12 flex animate-[fade-up_0.7s_ease-out_both] gap-8 border-t border-white/[0.1] pt-6 font-mono text-[11px] text-white/35"
            style={{ animationDelay: "320ms" }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[22px] font-medium leading-none tabular-nums text-white/80">{stats.libraries}</span>
              <span>libraries</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[22px] font-medium leading-none tabular-nums text-white/80">{stats.platforms}</span>
              <span>platforms</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[22px] font-medium leading-none tabular-nums text-white/80">2026</span>
              <span>updated</span>
            </div>
          </div>
        </div>
      </section>

      <Gallery libraries={libraries} />
    </div>
  )
}
