"use client"

import { useEffect, useRef } from "react"
import {
  buildMetaEcommerceParams,
  trackInitiateCheckout,
  type MetaLineInput,
} from "@lib/analytics/meta-pixel"

type MetaInitiateCheckoutProps = {
  cartId: string
  currency?: string | null
  value?: number | null
  lines: MetaLineInput[]
}

export default function MetaInitiateCheckout({
  cartId,
  currency,
  value,
  lines,
}: MetaInitiateCheckoutProps) {
  const firedForCart = useRef<string | null>(null)

  useEffect(() => {
    const id = cartId?.trim()
    if (!id || !lines.length) return
    if (firedForCart.current === id) return
    firedForCart.current = id

    trackInitiateCheckout(
      buildMetaEcommerceParams({
        lines,
        currency,
        value,
      })
    )
  }, [cartId, currency, value, lines])

  return null
}
