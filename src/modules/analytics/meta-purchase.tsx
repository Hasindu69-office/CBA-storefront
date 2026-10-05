"use client"

import { useEffect, useRef } from "react"
import {
  buildMetaEcommerceParams,
  claimPurchaseEvent,
  trackPurchase,
  type MetaLineInput,
} from "@lib/analytics/meta-pixel"

type MetaPurchaseProps = {
  orderId: string
  currency?: string | null
  value?: number | null
  lines: MetaLineInput[]
}

export default function MetaPurchase({
  orderId,
  currency,
  value,
  lines,
}: MetaPurchaseProps) {
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    const id = orderId?.trim()
    if (!id || !lines.length) return
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return
    if (!currency?.trim()) return
    if (!claimPurchaseEvent(id)) return

    attempted.current = true
    trackPurchase(
      buildMetaEcommerceParams({
        lines,
        currency,
        value,
        eventID: id,
      }),
      id
    )
  }, [orderId, currency, value, lines])

  return null
}
