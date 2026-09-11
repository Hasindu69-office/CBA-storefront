"use client"

import EcommerceLoader from "@modules/common/components/ecommerce-loader"
import { usePathname } from "next/navigation"
import { MouseEvent, useEffect, useRef, useState } from "react"

const HOME_PATHS = new Set(["", "/"])

const normalizePath = (path: string) => {
  const withoutQuery = path.split("?")[0].split("#")[0]
  const normalized = withoutQuery.replace(/\/+$/, "")

  return normalized || "/"
}

const isHomePath = (path: string) => {
  const normalizedPath = normalizePath(path)
  const segments = normalizedPath.split("/").filter(Boolean)

  return HOME_PATHS.has(normalizedPath) || (segments.length === 1 && segments[0].length === 2)
}

export default function HomeNavigationLoader() {
  const pathname = usePathname()
  const previousPathname = useRef(pathname)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname
      setIsLoading(false)
    }
  }, [pathname])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent | globalThis.MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target as HTMLElement | null
      const link = target?.closest("a")

      if (!link || link.target === "_blank" || link.hasAttribute("download")) {
        return
      }

      const destination = new URL(link.href, window.location.href)

      if (
        destination.origin !== window.location.origin ||
        isHomePath(pathname) ||
        !isHomePath(destination.pathname)
      ) {
        return
      }

      setIsLoading(true)
    }

    document.addEventListener("click", handleDocumentClick, true)

    return () => document.removeEventListener("click", handleDocumentClick, true)
  }, [pathname])

  return isLoading ? <EcommerceLoader label="Loading homepage" /> : null
}
