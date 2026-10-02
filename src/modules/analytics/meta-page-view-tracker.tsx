"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { trackPageView } from "@lib/analytics/meta-pixel"

/**
 * Fires PageView on client-side route changes.
 * Skips the first mount because MetaPixelBootstrap already tracked it.
 */
export default function MetaPageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstPath = useRef(true)

  useEffect(() => {
    if (isFirstPath.current) {
      isFirstPath.current = false
      return
    }
    trackPageView()
  }, [pathname, searchParams])

  return null
}
