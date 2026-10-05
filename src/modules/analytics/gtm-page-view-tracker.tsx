"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { pushVirtualPageView } from "@lib/analytics/gtm"

/**
 * Pushes virtualPageView on client-side route changes.
 * Skips the first mount because GTM already records the initial page load.
 */
export default function GtmPageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstPath = useRef(true)

  useEffect(() => {
    if (isFirstPath.current) {
      isFirstPath.current = false
      return
    }

    const query = searchParams?.toString()
    const pagePath = query ? `${pathname}?${query}` : pathname
    pushVirtualPageView(pagePath)
  }, [pathname, searchParams])

  return null
}
