"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"

export function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.182 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418Z" />
    </svg>
  )
}

const NAV = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload" },
] as const

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative py-1 text-[13px] tracking-tight transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {active && (
        <span className="absolute -bottom-px left-0 h-px w-full bg-foreground" />
      )}
    </Link>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = React.useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border bg-background/40 py-1 pr-2.5 pl-1 transition-colors hover:bg-muted"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="size-6 rounded-full object-cover" />
        ) : (
          <span
            className="grid size-6 place-items-center rounded-full text-[11px] font-semibold text-black"
            style={{ backgroundColor: user.accent }}
          >
            {user.username.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="font-mono text-[12px] tracking-tight">{user.username}</span>
        {user.isModerator && (
          <span className="rounded bg-foreground/10 px-1 py-px font-mono text-[9px] tracking-wide text-foreground/70 uppercase">
            mod
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-52 origin-top-right animate-[scale-in_0.12s_ease-out] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl">
            <div className="px-2.5 py-2">
              <p className="text-[13px] font-medium tracking-tight">{user.username}</p>
              <p className="font-mono text-[10px] text-muted-foreground">Discord</p>
            </div>
            <div className="my-1 h-px bg-border" />
            <Link
              href="/upload"
              onClick={() => setOpen(false)}
              className="block rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Upload a library
            </Link>
            {user.isModerator && (
              <Link
                href="/moderation"
                onClick={() => setOpen(false)}
                className="block rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Moderation queue
              </Link>
            )}
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => {
                logout()
                setOpen(false)
              }}
              className="block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const { user, loading, login } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 sm:px-10">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-foreground" />
            <span className="font-mono text-[13px] tracking-tight">uilib</span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={pathname === item.href}
              />
            ))}
            {user?.isModerator && (
              <NavLink href="/moderation" label="Moderation" active={pathname === "/moderation"} />
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-1.5 font-mono text-[11px] text-muted-foreground md:flex">
            <kbd className="rounded border border-border px-1 py-px text-[10px]">D</kbd>
            theme
          </span>
          {loading ? (
            <span className="h-8 w-24 animate-[fade-in_0.4s_ease-out] rounded-full bg-muted/50" />
          ) : user ? (
            <UserMenu />
          ) : (
            <button
              type="button"
              onClick={() => login()}
              className="flex items-center gap-1.5 rounded-lg bg-[#5865F2] px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <DiscordIcon className="size-3.5" />
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
