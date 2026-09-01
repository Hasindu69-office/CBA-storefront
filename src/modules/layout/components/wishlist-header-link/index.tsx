"use client"

import {
  WISHLIST_COUNT_UPDATE_EVENT,
  type WishlistCountUpdateOptions,
} from "@lib/util/wishlist-count-event"
import { formatDisplayCount } from "@lib/util/format-display-count"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HeartIcon } from "@modules/layout/components/cba-icons"
import { useEffect, useState } from "react"

type WishlistHeaderLinkProps = {
  initialCount: number
  label?: string
  variant: "mobile" | "desktop"
}

export default function WishlistHeaderLink({
  initialCount,
  label = "Wishlist",
  variant,
}: WishlistHeaderLinkProps) {
  const [count, setCount] = useState(initialCount)
  const displayCount = formatDisplayCount(count)

  useEffect(() => {
    setCount(initialCount)
  }, [initialCount])

  useEffect(() => {
    const updateCount = (event: Event) => {
      const detail =
        (event as CustomEvent<WishlistCountUpdateOptions>).detail ?? {}
      if (Number.isInteger(detail.count) && detail.count >= 0) {
        setCount(detail.count)
      }
    }

    window.addEventListener(WISHLIST_COUNT_UPDATE_EVENT, updateCount)

    return () => {
      window.removeEventListener(WISHLIST_COUNT_UPDATE_EVENT, updateCount)
    }
  }, [])

  if (variant === "mobile") {
    return (
      <LocalizedClientLink
        href="/wishlist"
        className="flex min-w-[38px] flex-col items-center gap-0.5 text-black transition-opacity hover:opacity-80 xsmall:min-w-[42px]"
        aria-label={`Wishlist with ${count} ${count === 1 ? "item" : "items"}`}
      >
        <span className="relative block">
          <HeartIcon size={23} strokeWidth={1.55} className="text-black" />
          {count > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white"
            >
              {displayCount}
            </span>
          )}
        </span>
        <span className="leading-none">{label}</span>
      </LocalizedClientLink>
    )
  }

  return (
    <LocalizedClientLink
      href="/wishlist"
      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      aria-label={`Wishlist with ${count} ${count === 1 ? "item" : "items"}`}
    >
      <HeartIcon size={26} strokeWidth={1.5} className="text-black" />
      <div className="hidden medium:block leading-tight">
        <p className="font-semibold text-black text-[15px]">{label}</p>
        <p className="text-gray-400 text-[12px] mt-0.5">
          {displayCount} {count === 1 ? "item" : "items"}
        </p>
      </div>
    </LocalizedClientLink>
  )
}
