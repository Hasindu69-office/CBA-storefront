"use client"

import { Suspense } from "react"
import GtmPageViewTracker from "./gtm-page-view-tracker"

/** Suspense boundary required for useSearchParams in the App Router. */
export default function GtmPageViewTrackerBoundary() {
  return (
    <Suspense fallback={null}>
      <GtmPageViewTracker />
    </Suspense>
  )
}
