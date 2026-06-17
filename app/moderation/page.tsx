import Link from "next/link"

import { DiscordIcon, SiteHeader } from "@/components/site-header"

export const dynamic = "force-dynamic"
import { ModerationQueue } from "@/components/moderation-queue"
import { getPendingLibraries } from "@/lib/libraries"
import { createClient } from "@/lib/supabase/server"

function SignInGate() {
  return (
    <div className="mx-auto flex max-w-md animate-[fade-up_0.5s_ease-out_both] flex-col items-center py-24 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-[#5865F2]/10 text-[#5865F2]">
        <DiscordIcon className="size-6" />
      </span>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Sign in required</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
        Moderation is for signed-in moderators only.
      </p>
      <Link
        href="/upload"
        className="mt-7 rounded-lg bg-[#5865F2] px-4 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
      >
        Sign in via Upload page
      </Link>
    </div>
  )
}

function NoAccess() {
  return (
    <div className="mx-auto flex max-w-md animate-[fade-up_0.5s_ease-out_both] flex-col items-center py-24 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-border bg-muted text-muted-foreground">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </span>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Moderators only</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
        Your Discord account doesn&rsquo;t have the moderator role. Ask an admin
        to set <code className="rounded bg-muted px-1 py-px font-mono text-[12px]">is_moderator = true</code>{" "}
        on your profile in Supabase.
      </p>
      <Link
        href="/"
        className="mt-6 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        Back to gallery
      </Link>
    </div>
  )
}

export default async function ModerationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isModerator = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_moderator")
      .eq("id", user.id)
      .single()
    isModerator = profile?.is_moderator ?? false
  }

  const queue = isModerator ? await getPendingLibraries() : []

  return (
    <div className="min-h-svh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        {!user ? (
          <SignInGate />
        ) : !isModerator ? (
          <NoAccess />
        ) : (
          <ModerationQueue initialQueue={queue} />
        )}
      </main>
    </div>
  )
}
