export const META_STANDARD_EVENTS = [
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
] as const

export type MetaStandardEvent = (typeof META_STANDARD_EVENTS)[number]

export type MetaContentItem = {
  id: string
  quantity: number
  item_price?: number
}

/**
 * Standard Meta ecommerce event parameters.
 * Only known keys are retained after validation (no PII / Advanced Matching).
 */
export type MetaEcommerceParams = {
  content_ids?: string[]
  content_type?: "product" | "product_group"
  content_name?: string
  contents?: MetaContentItem[]
  currency?: string
  value?: number
  num_items?: number
  /** Used for Purchase dedupe with Conversions API later. */
  eventID?: string
}

export type MetaTrackOptions = {
  /** Meta eventID option bag (Purchase). Kept separate from params. */
  eventID?: string
}

export type FbqCommand = (
  command: "init" | "track" | "trackCustom" | "consent",
  ...args: unknown[]
) => void

declare global {
  interface Window {
    fbq?: FbqCommand & {
      callMethod?: (...args: unknown[]) => void
      queue?: unknown[]
      loaded?: boolean
      version?: string
      push?: (...args: unknown[]) => void
    }
    _fbq?: Window["fbq"]
  }
}

export type MetaLineInput = {
  productId: string
  quantity: number
  itemPrice?: number | null
  title?: string | null
}

export type MetaCommerceInput = {
  lines: MetaLineInput[]
  currency?: string | null
  value?: number | null
  contentName?: string | null
  eventID?: string | null
}
