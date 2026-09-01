"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

export default function RouteScrollRestoration() {
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    previousPathname.current = pathname
  }, [pathname])

  return null
}
