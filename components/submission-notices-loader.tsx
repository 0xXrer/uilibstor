"use client"

import * as React from "react"

import { SubmissionNotices } from "@/components/submission-notices"
import { createClient } from "@/lib/supabase/client"
import type { UserSubmission } from "@/lib/libraries"

export function SubmissionNoticesLoader({ userId }: { userId: string }) {
  const [submissions, setSubmissions] = React.useState<UserSubmission[]>([])
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    let alive = true
    const sb = createClient()
    if (!sb) {
      setLoaded(true)
      return
    }

    void sb
      .from("libraries")
      .select("id, name, status, rejection_reason, reviewed_at, created_at")
      .eq("author_id", userId)
      .in("status", ["pending", "rejected"])
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return
        if (!error && data) {
          setSubmissions(
            data.map((row) => ({
              id: row.id,
              name: row.name,
              status: row.status,
              rejectionReason: row.rejection_reason,
              reviewedAt: row.reviewed_at,
              createdAt: row.created_at,
            })),
          )
        }
        setLoaded(true)
      })

    return () => {
      alive = false
    }
  }, [userId])

  if (!loaded) return null
  return <SubmissionNotices submissions={submissions} />
}
