"use client"

import { notify } from "@lib/notifications"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

export default function LogoutNotice() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const shown = useRef(false)

  useEffect(() => {
    if (shown.current || searchParams.get("signed_out") !== "1") {
      return
    }

    shown.current = true
    notify.success("You’ve been signed out successfully.", {
      id: "customer-signed-out",
    })

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete("signed_out")
    const query = nextParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  return null
}
