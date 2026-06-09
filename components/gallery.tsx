"use client"

import * as React from "react"
import Link from "next/link"

import { LibraryPreview } from "@/components/library-preview"
import type { Library } from "@/lib/libraries"

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-5 place-items-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground">
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}

function Meta({ lib }: { lib: Library }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-muted-foreground">
      <span className="flex items-center gap-1">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M8 13.5S2 10 2 5.8A3 3 0 0 1 8 4a3 3 0 0 1 6 1.8C14 10 8 13.5 8 13.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
        {formatCount(lib.likes)}
      </span>
      <span className="flex items-center gap-1">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8Z" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        {formatCount(lib.views)}
      </span>
    </div>
  )
}

function Card({ lib, index }: { lib: Library; index: number }) {
  return (
    <Link
      href={`/library/${lib.slug}`}
      className="group block animate-[fade-up_0.5s_ease-out_both]"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-[#0b0b0c] transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        {lib.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lib.cover}
            alt={`${lib.name} preview`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <LibraryPreview kind={lib.kind} accent={lib.accent} name={lib.name} />
        )}
        <span className="absolute top-3 left-3 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] tracking-tight text-white/70 backdrop-blur-sm">
          {lib.platform}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={lib.author} />
          <div className="leading-tight">
            <p className="text-[13px] font-medium tracking-tight">{lib.name}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{lib.author}</p>
          </div>
        </div>
        <Meta lib={lib} />
      </div>
    </Link>
  )
}

function SubmitTile() {
  return (
    <Link href="/upload" className="group block">
      <div className="grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-border bg-transparent transition-colors group-hover:border-foreground/40 group-hover:bg-muted/40">
        <div className="text-center">
          <span className="mx-auto grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors group-hover:text-foreground">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <p className="mt-3 text-[13px] font-medium tracking-tight">Share your library</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">Sign in with Discord to publish</p>
        </div>
      </div>
    </Link>
  )
}

export function Gallery({ libraries }: { libraries: Library[] }) {
  const [query, setQuery] = React.useState("")

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return libraries
    return libraries.filter(
      (lib) =>
        lib.name.toLowerCase().includes(q) ||
        lib.author.toLowerCase().includes(q) ||
        lib.platform.toLowerCase().includes(q),
    )
  }, [query, libraries])

  return (
    <main className="mx-auto max-w-6xl px-6 sm:px-10" id="gallery">
      <section className="border-b border-border pt-5">
        <div className="flex items-center gap-3 pb-4">
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden className="shrink-0 text-muted-foreground">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, author or platform"
            className="w-full bg-transparent py-1.5 text-[15px] tracking-tight outline-none placeholder:text-muted-foreground/60"
          />
          <span className="shrink-0 font-mono text-[12px] tabular-nums text-muted-foreground">
            {String(results.length).padStart(2, "0")}
          </span>
        </div>
      </section>

      <section className="pt-8 pb-24">
        {results.length === 0 ? (
          <p className="py-20 text-center font-mono text-[13px] text-muted-foreground">
            {libraries.length === 0
              ? "The shelf is empty. Be the first to publish."
              : `Nothing on the shelf for "${query}".`}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((lib, i) => (
              <Card key={lib.id} lib={lib} index={i} />
            ))}
            {!query && <SubmitTile />}
          </div>
        )}
      </section>

      <footer
        id="submit"
        className="grid grid-cols-1 gap-8 border-t border-border py-14 md:grid-cols-12"
      >
        <div className="md:col-span-7">
          <h2 className="text-xl font-medium tracking-tight">Publish your library</h2>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
            uilib is a community shelf. Drop a link to your source, a preview
            of the menu, and it joins the gallery for everyone to read and use.
          </p>
          <Link
            href="/upload"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
          >
            Submit a library
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        <div className="flex gap-10 font-mono text-[12px] text-muted-foreground md:col-span-5 md:justify-end">
          <div className="flex flex-col gap-2">
            <a href="#" className="transition-colors hover:text-foreground">Source</a>
            <a href="#" className="transition-colors hover:text-foreground">Guidelines</a>
            <a href="#" className="transition-colors hover:text-foreground">Discord</a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-foreground">© 2026</span>
            <span>{libraries.length} libraries</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
