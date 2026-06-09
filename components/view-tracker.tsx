"use client"

import * as React from "react"

import { incrementViews } from "@/lib/actions/libraries"

export function ViewTracker({ libraryId }: { libraryId: string }) {
  React.useEffect(() => {
    incrementViews(libraryId)
  }, [libraryId])

  return null
}
