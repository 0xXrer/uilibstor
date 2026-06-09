"use client"

import * as React from "react"

import { signInWithDiscord, signOut } from "@/lib/actions/libraries"
import { createClient } from "@/lib/supabase/client"

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
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<AppUser | null> {
  const supabase = createClient()
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single()
  if (!data) return null

  return {
    id: data.id,
    username: data.username,
    avatarUrl: data.avatar_url,
    accent: data.accent,
    isModerator: data.is_moderator,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AppUser | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const supabase = createClient()

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        const profile = await fetchProfile(authUser.id)
        setUser(profile)
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    load()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setUser(profile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = React.useCallback(async () => {
    const result = await signInWithDiscord()
    if (result.url) window.location.href = result.url
  }, [])

  const logout = React.useCallback(async () => {
    await signOut()
    setUser(null)
  }, [])

  const value = React.useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
