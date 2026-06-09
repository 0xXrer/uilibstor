"use client"

import * as React from "react"

import type { Session, User } from "@supabase/supabase-js"

import { signInWithDiscord, signOut } from "@/lib/actions/libraries"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export type AppUser = {
  id: string
  username: string
  avatarUrl: string | null
  accent: string
  isModerator: boolean
}

type AuthContextValue = {
  user: AppUser | null
  loading: boolean
  configured: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function userFromAuth(authUser: User): AppUser {
  const meta = authUser.user_metadata ?? {}
  const username =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    (meta.preferred_username as string | undefined) ??
    (meta.user_name as string | undefined) ??
    authUser.email?.split("@")[0] ??
    "user"

  return {
    id: authUser.id,
    username,
    avatarUrl: (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined) ?? null,
    accent: "oklch(0.72 0.15 250)",
    isModerator: false,
  }
}

async function resolveUser(authUser: User): Promise<AppUser> {
  const supabase = createClient()
  if (!supabase) return userFromAuth(authUser)

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle()

  if (error) {
    console.error("profile fetch failed:", error.message)
  }

  if (data) {
    return {
      id: data.id,
      username: data.username,
      avatarUrl: data.avatar_url,
      accent: data.accent,
      isModerator: data.is_moderator,
    }
  }

  return userFromAuth(authUser)
}

async function applySession(
  session: Session | null,
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
) {
  if (session?.user) {
    const resolved = await resolveUser(session.user)
    setUser(resolved)
  } else {
    setUser(null)
  }
  setLoading(false)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AppUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const configured = isSupabaseConfigured()

  React.useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    const sb = createClient()
    if (!sb) {
      setLoading(false)
      return
    }

    let alive = true

    const sync = (session: Session | null) => {
      // Defer Supabase data calls — avoids auth client deadlock.
      setTimeout(() => {
        if (!alive) return
        void applySession(session, setUser, setLoading)
      }, 0)
    }

    void sb.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return
      sync(session)
    })

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (!alive) return
      setLoading(true)
      sync(session)
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [configured])

  const login = React.useCallback(async () => {
    if (!configured) {
      alert("Supabase is not configured. Copy .env.local.example to .env.local and add your project keys.")
      return
    }
    const result = await signInWithDiscord()
    if (result.error) {
      alert(result.error)
      return
    }
    if (result.url) window.location.href = result.url
  }, [configured])

  const logout = React.useCallback(async () => {
    if (!configured) return
    await signOut()
    setUser(null)
  }, [configured])

  const value = React.useMemo(
    () => ({ user, loading, configured, login, logout }),
    [user, loading, configured, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
