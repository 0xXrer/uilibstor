import * as React from "react"

import { cn } from "@/lib/utils"

export type Kind = "luau" | "imgui" | "modern"

export const KIND_LABELS: Record<Kind, string> = {
  luau: "Luau menu",
  imgui: "Dear ImGui",
  modern: "Modern overlay",
}

export const ACCENT_PRESETS = [
  "oklch(0.72 0.15 250)",
  "oklch(0.74 0.13 70)",
  "oklch(0.74 0.13 165)",
  "oklch(0.72 0.15 20)",
  "oklch(0.72 0.14 300)",
  "oklch(0.75 0.12 200)",
  "oklch(0.73 0.14 130)",
]

export function Stage({
  accent,
  children,
  className,
}: {
  accent: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0b0c]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, oklch(0.26 0 0) 0%, transparent 55%), #0b0b0c",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 blur-2xl"
        style={{
          background: `radial-gradient(50% 60% at 70% 30%, color-mix(in oklch, ${accent} 10%, transparent) 0%, transparent 70%)`,
        }}
      />
      {children}
    </div>
  )
}

function Toggle({ on, accent }: { on?: boolean; accent: string }) {
  return (
    <span
      className={cn(
        "flex h-[10px] w-[18px] items-center rounded-full p-px",
        on ? "justify-end" : "justify-start bg-white/10",
      )}
      style={on ? { backgroundColor: accent } : undefined}
    >
      <span className="size-2 rounded-full bg-white shadow-sm" />
    </span>
  )
}

function LuauPreview({ accent, name }: { accent: string; name: string }) {
  return (
    <div className="absolute top-1/2 left-1/2 w-[78%] -translate-x-1/2 -translate-y-1/2">
      <div className="overflow-hidden rounded-[10px] border border-white/10 bg-zinc-900/85 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: accent }} />
            <span className="text-[9px] font-medium tracking-tight text-white/85">{name}</span>
          </div>
          <div className="flex gap-1">
            <span className="size-1 rounded-full bg-white/20" />
            <span className="size-1 rounded-full bg-white/20" />
          </div>
        </div>
        <div className="flex">
          <div className="flex flex-col gap-1.5 border-r border-white/[0.06] p-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="size-4 rounded-md"
                style={
                  i === 0
                    ? { backgroundColor: accent, opacity: 0.9 }
                    : { backgroundColor: "rgba(255,255,255,0.07)" }
                }
              />
            ))}
          </div>
          <div className="flex-1 space-y-2 p-2.5">
            <span className="block text-[7px] tracking-[0.12em] text-white/35 uppercase">Combat</span>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/75">Aimbot</span>
              <Toggle on accent={accent} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/75">Triggerbot</span>
              <Toggle accent={accent} />
            </div>
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/75">Smoothness</span>
                <span className="text-[8px] text-white/40">0.42</span>
              </div>
              <div className="h-1 w-full rounded-full bg-white/10">
                <div className="h-1 rounded-full" style={{ width: "42%", backgroundColor: accent }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImGuiPreview({ accent, name }: { accent: string; name: string }) {
  return (
    <div className="absolute top-1/2 left-1/2 w-[74%] -translate-x-1/2 -translate-y-1/2 font-mono">
      <div className="overflow-hidden rounded-[3px] border border-black/50 bg-[#15171b]/95 shadow-2xl">
        <div className="flex items-center gap-1.5 border-b border-black/40 bg-white/[0.04] px-2 py-1">
          <span className="text-[8px] text-white/40">▾</span>
          <span className="text-[8px] font-semibold tracking-tight text-white/80">{name}</span>
        </div>
        <div className="space-y-1.5 p-2">
          <div
            className="flex items-center gap-1 rounded-[2px] px-1.5 py-1"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            <span className="text-[8px]" style={{ color: accent }}>▾</span>
            <span className="text-[8px] text-white/70">Aimbot</span>
          </div>
          <label className="flex items-center gap-1.5">
            <span
              className="grid size-2.5 place-items-center rounded-[2px]"
              style={{ backgroundColor: accent }}
            >
              <span className="text-[7px] leading-none text-black">✓</span>
            </span>
            <span className="text-[8px] text-white/65">Enabled</span>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px] border border-white/25" />
            <span className="text-[8px] text-white/65">Visibility check</span>
          </label>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 flex-1 rounded-[2px] bg-black/40">
              <div className="h-1.5 rounded-[2px]" style={{ width: "60%", backgroundColor: accent }} />
            </div>
            <span className="text-[7px] text-white/45">1.20</span>
          </div>
          <div
            className="rounded-[2px] py-1 text-center text-[8px] font-medium text-black"
            style={{ backgroundColor: accent }}
          >
            Inject
          </div>
        </div>
      </div>
    </div>
  )
}

function ModernPreview({ accent, name }: { accent: string; name: string }) {
  return (
    <div className="absolute top-1/2 left-1/2 w-[80%] -translate-x-1/2 -translate-y-1/2">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2.5">
          <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeOpacity="0.4" strokeWidth="1.3" />
            <path d="M10 10L13 13" stroke="white" strokeOpacity="0.4" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span className="text-[9px] text-white/35">Search {name}…</span>
          <span className="ml-auto rounded border border-white/15 px-1 text-[7px] text-white/40">⌘K</span>
        </div>
        <div className="space-y-0.5 p-1.5">
          <div
            className="flex items-center justify-between rounded-lg px-2 py-1.5"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: accent }} />
              <span className="text-[9px] text-white/80">ESP Players</span>
            </div>
            <Toggle on accent={accent} />
          </div>
          <div className="flex items-center justify-between rounded-lg px-2 py-1.5">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-white/20" />
              <span className="text-[9px] text-white/60">Fly</span>
            </div>
            <Toggle accent={accent} />
          </div>
          <div className="flex items-center justify-between rounded-lg px-2 py-1.5">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-white/20" />
              <span className="text-[9px] text-white/60">Speed</span>
            </div>
            <span className="text-[8px] text-white/40">16.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LibraryPreview({
  kind,
  accent,
  name,
}: {
  kind: Kind
  accent: string
  name: string
}) {
  if (kind === "imgui") return <ImGuiPreview accent={accent} name={name} />
  if (kind === "modern") return <ModernPreview accent={accent} name={name} />
  return <LuauPreview accent={accent} name={name} />
}
