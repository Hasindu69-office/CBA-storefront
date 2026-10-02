import { validateMetaEcommerceParams } from "./validate"
import type { MetaEcommerceParams, MetaStandardEvent } from "./types"

function logDev(message: string, detail?: unknown) {
  if (process.env.NODE_ENV === "production") return
  if (detail !== undefined) {
    console.debug(`[meta-pixel] ${message}`, detail)
  } else {
    console.debug(`[meta-pixel] ${message}`)
  }
}

function getFbq(): Window["fbq"] | null {
  if (typeof window === "undefined") return null
  return typeof window.fbq === "function" ? window.fbq : null
}

/**
 * Fail-safe Meta Pixel track. Never throws into UI flows.
 * Invalid payloads are dropped after validation.
 */
export function trackMetaEvent(
  event: MetaStandardEvent,
  params?: MetaEcommerceParams | null,
  options?: { eventID?: string }
): boolean {
  try {
    const validated = validateMetaEcommerceParams(event, params, options)
    if (!validated.ok) {
      logDev(`Skipped ${event}: ${validated.reason}`, params)
      return false
    }

    const fbq = getFbq()
    if (!fbq) {
      logDev(`fbq unavailable for ${event}`)
      return false
    }

    if (event === "PageView") {
      fbq("track", "PageView")
      return true
    }

    if (validated.eventID) {
      fbq("track", event, validated.params, { eventID: validated.eventID })
    } else {
      fbq("track", event, validated.params)
    }
    return true
  } catch (error) {
    logDev(`Failed ${event}`, error)
    return false
  }
}

export function trackPageView(): boolean {
  return trackMetaEvent("PageView")
}

export function trackViewContent(params: MetaEcommerceParams): boolean {
  return trackMetaEvent("ViewContent", params)
}

export function trackAddToCart(params: MetaEcommerceParams): boolean {
  return trackMetaEvent("AddToCart", params)
}

export function trackInitiateCheckout(params: MetaEcommerceParams): boolean {
  return trackMetaEvent("InitiateCheckout", params)
}

export function trackPurchase(
  params: MetaEcommerceParams,
  eventID: string
): boolean {
  return trackMetaEvent("Purchase", params, { eventID })
}
