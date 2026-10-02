import type {
  MetaContentItem,
  MetaEcommerceParams,
  MetaStandardEvent,
} from "./types"
import { META_STANDARD_EVENTS } from "./types"

const MAX_CONTENT_IDS = 50
const MAX_ID_LENGTH = 128
const MAX_NAME_LENGTH = 150
const CURRENCY_PATTERN = /^[A-Za-z]{3}$/

export type MetaValidationResult =
  | { ok: true; params: MetaEcommerceParams; eventID?: string }
  | { ok: false; reason: string }

function isStandardEvent(event: string): event is MetaStandardEvent {
  return (META_STANDARD_EVENTS as readonly string[]).includes(event)
}

function sanitizeId(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_ID_LENGTH) return null
  return trimmed
}

function sanitizeName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, MAX_NAME_LENGTH)
}

function sanitizeCurrency(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const code = value.trim().toUpperCase()
  if (!CURRENCY_PATTERN.test(code)) return undefined
  return code
}

function sanitizeAmount(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined
  }
  // Round to 2 dp for money stability without changing major-unit semantics.
  return Math.round(value * 100) / 100
}

function sanitizeQuantity(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return null
  }
  return Math.min(value, 999)
}

function sanitizeContents(value: unknown): MetaContentItem[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items: MetaContentItem[] = []
  for (const entry of value.slice(0, MAX_CONTENT_IDS)) {
    if (!entry || typeof entry !== "object") continue
    const raw = entry as Record<string, unknown>
    const id = sanitizeId(raw.id)
    const quantity = sanitizeQuantity(raw.quantity)
    if (!id || quantity === null) continue
    const item: MetaContentItem = { id, quantity }
    const price = sanitizeAmount(raw.item_price)
    if (price !== undefined) item.item_price = price
    items.push(item)
  }
  return items.length ? items : undefined
}

function sanitizeContentIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const ids: string[] = []
  const seen = new Set<string>()
  for (const entry of value.slice(0, MAX_CONTENT_IDS)) {
    const id = sanitizeId(entry)
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids.length ? ids : undefined
}

/**
 * Validates and sanitizes Meta ecommerce params.
 * Returns only allow-listed keys — never PII fields.
 */
export function validateMetaEcommerceParams(
  event: string,
  raw: MetaEcommerceParams | null | undefined,
  options?: { eventID?: string }
): MetaValidationResult {
  if (!isStandardEvent(event)) {
    return { ok: false, reason: "Unsupported event" }
  }

  if (event === "PageView") {
    return { ok: true, params: {} }
  }

  const source = raw && typeof raw === "object" ? raw : {}
  const params: MetaEcommerceParams = {}

  const contentIds = sanitizeContentIds(source.content_ids)
  if (contentIds) params.content_ids = contentIds

  const contents = sanitizeContents(source.contents)
  if (contents) params.contents = contents

  if (source.content_type === "product" || source.content_type === "product_group") {
    params.content_type = source.content_type
  }

  const contentName = sanitizeName(source.content_name)
  if (contentName) params.content_name = contentName

  const currency = sanitizeCurrency(source.currency)
  if (currency) params.currency = currency

  const value = sanitizeAmount(source.value)
  if (value !== undefined) params.value = value

  if (
    typeof source.num_items === "number" &&
    Number.isInteger(source.num_items) &&
    source.num_items >= 1
  ) {
    params.num_items = Math.min(source.num_items, 9999)
  }

  const eventID =
    sanitizeId(options?.eventID) ?? sanitizeId(source.eventID) ?? undefined

  // Ecommerce funnel events need at least one content id (or contents).
  if (
    event === "ViewContent" ||
    event === "AddToCart" ||
    event === "InitiateCheckout" ||
    event === "Purchase"
  ) {
    if (!params.content_ids?.length && !params.contents?.length) {
      return { ok: false, reason: "Missing content_ids" }
    }
  }

  if (event === "Purchase") {
    if (params.value === undefined) {
      return { ok: false, reason: "Missing purchase value" }
    }
    if (!params.currency) {
      return { ok: false, reason: "Missing purchase currency" }
    }
    if (!eventID) {
      return { ok: false, reason: "Missing purchase eventID" }
    }
  }

  return { ok: true, params, eventID }
}
