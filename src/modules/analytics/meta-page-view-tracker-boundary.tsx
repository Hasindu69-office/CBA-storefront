"use client"

import { Suspense } from "react"
import MetaPageViewTracker from "./meta-page-view-tracker"

/** Suspense boundary required for useSearchParams in the App Router. */
export default function MetaPageViewTrackerBoundary() {
  return (
    <Suspense fallback={null}>
      <MetaPageViewTracker />
    </Suspense>
  )
}
