import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

import { CustomLibraryEmbed } from "@/components/custom-library-embed"
import { LibraryPreview, Stage } from "@/components/library-preview"
import { LibraryLikeButton } from "@/components/library-like-button"
import { Markdown } from "@/components/markdown"
import { ScreenshotGrid } from "@/components/screenshot-grid"
import { SiteHeader } from "@/components/site-header"
import { ViewTracker } from "@/components/view-tracker"
import { getCustomLibraryPageUrl } from "@/lib/custom-library-pages"
import { getLibraryBySlug, userLikedLibrary } from "@/lib/libraries"
import { createClient } from "@/lib/supabase/server"

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: slug } = await params
  const customUrl = getCustomLibraryPageUrl(slug)

  if (customUrl) {
    const lib = await getLibraryBySlug(slug)

    return (
      <div className="flex min-h-svh flex-col">
        {lib && <ViewTracker libraryId={lib.id} />}
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-2 sm:px-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              gallery
            </Link>
            <a
              href={customUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Open in new tab
            </a>
          </div>
          <CustomLibraryEmbed src={customUrl} title={lib?.name ?? slug} />
        </div>
      </div>
    )
  }

  const lib = await getLibraryBySlug(slug)
  if (!lib) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const liked = user ? await userLikedLibrary(lib.id, user.id) : false

  return (
    <div className="min-h-svh">
      <ViewTracker libraryId={lib.id} />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <div className="animate-[fade-up_0.5s_ease-out_both]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            gallery
          </Link>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="grid size-10 place-items-center rounded-xl text-[15px] font-semibold text-black"
                style={{ backgroundColor: lib.accent }}
              >
                {lib.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h1 className="text-2xl font-medium tracking-tight">{lib.name}</h1>
                <p className="font-mono text-[12px] text-muted-foreground">
                  by {lib.author} · {lib.platform}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LibraryLikeButton
                libraryId={lib.id}
                initialLikes={lib.likes}
                initialLiked={liked}
              />
              <a
                href={lib.source}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Get source
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
            <div>
              {lib.cover ? (
                <div className="overflow-hidden rounded-xl border border-border bg-[#0b0b0c]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lib.cover}
                    alt={`${lib.name} preview`}
                    className="aspect-[16/10] w-full object-cover"
                  />
                </div>
              ) : (
                <Stage accent={lib.accent} className="aspect-[16/10]">
                  <LibraryPreview kind={lib.kind} accent={lib.accent} name={lib.name} />
                </Stage>
              )}

              <section className="mt-10">
                <h2 className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                  Screenshots
                </h2>
                <ScreenshotGrid screenshots={lib.screenshots} name={lib.name} />
              </section>

              <section className="mt-10">
                <h2 className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                  About
                </h2>
                {lib.description.trim() ? (
                  <Markdown className="mt-2">{lib.description}</Markdown>
                ) : (
                  <p className="mt-3 text-[14px] text-muted-foreground">No description yet.</p>
                )}
              </section>
            </div>

            <aside className="lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-xl border border-border p-4">
                <dl className="space-y-3 text-[13px]">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Platform</dt>
                    <dd className="font-medium">{lib.platform}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Likes</dt>
                    <dd className="font-mono tabular-nums">{formatCount(lib.likes)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Views</dt>
                    <dd className="font-mono tabular-nums">{formatCount(lib.views)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Author</dt>
                    <dd className="font-medium">{lib.author}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                  <span className="size-3 rounded-full" style={{ backgroundColor: lib.accent }} />
                  <span className="font-mono text-[11px] text-muted-foreground">accent</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
