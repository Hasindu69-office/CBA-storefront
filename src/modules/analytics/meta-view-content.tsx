"use client"

import { useEffect, useRef } from "react"
import {
  buildSingleProductParams,
  trackViewContent,
} from "@lib/analytics/meta-pixel"

type MetaViewContentProps = {
  productId: string
  contentName?: string | null
  currency?: string | null
  value?: number | null
}

export default function MetaViewContent({
  productId,
  contentName,
  currency,
  value,
}: MetaViewContentProps) {
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    const id = productId?.trim()
    if (!id) return

    const key = `${id}:${currency ?? ""}:${value ?? ""}`
    if (lastKey.current === key) return
    lastKey.current = key

    trackViewContent(
      buildSingleProductParams({
        productId: id,
        contentName,
        currency,
        value,
        itemPrice: value,
      })
    )
  }, [productId, contentName, currency, value])

  return null
}
