import type { DataLayerPayload, DataLayerValue, VirtualPageViewPayload } from "./types"

const MAX_STRING_LENGTH = 500
const MAX_KEYS = 32
const KEY_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/

function logDev(message: string, detail?: unknown) {
  if (process.env.NODE_ENV === "production") return
  if (detail !== undefined) {
    console.debug(`[gtm] ${message}`, detail)
  } else {
    console.debug(`[gtm] ${message}`)
  }
}

function sanitizeValue(value: unknown): DataLayerValue | undefined {
  if (value === null) return null
  if (typeof value === "boolean") return value
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined
    return value
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    return trimmed.length > MAX_STRING_LENGTH
      ? trimmed.slice(0, MAX_STRING_LENGTH)
      : trimmed
  }
  return undefined
}

/**
 * Client-side validation: keep only plain scalar fields with safe keys.
 * Drops objects, arrays, functions, and oversized payloads.
 */
export function sanitizeDataLayerPayload(
  input: Record<string, unknown> | null | undefined
): DataLayerPayload | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null
  }

  const out: DataLayerPayload = {}
  let count = 0

  for (const [rawKey, rawValue] of Object.entries(input)) {
    if (count >= MAX_KEYS) break
    const key = rawKey.trim()
    if (!KEY_PATTERN.test(key)) continue
    const value = sanitizeValue(rawValue)
    if (value === undefined) continue
    out[key] = value
    count += 1
  }

  return Object.keys(out).length > 0 ? out : null
}

function ensureDataLayer(): unknown[] | null {
  if (typeof window === "undefined") return null
  const w = window as Window & { dataLayer?: unknown[] }
  if (!Array.isArray(w.dataLayer)) {
    w.dataLayer = []
  }
  return w.dataLayer
}

/**
 * Fail-soft dataLayer push. Never throws into UI flows.
 * Returns false when the payload is rejected or the browser context is unavailable.
 */
export function pushDataLayer(
  payload: Record<string, unknown> | null | undefined
): boolean {
  try {
    const sanitized = sanitizeDataLayerPayload(payload)
    if (!sanitized) {
      logDev("Skipped push: empty or invalid payload", payload)
      return false
    }

    const dataLayer = ensureDataLayer()
    if (!dataLayer) {
      logDev("dataLayer unavailable")
      return false
    }

    dataLayer.push(sanitized)
    return true
  } catch (error) {
    logDev("push failed", error)
    return false
  }
}

/**
 * Virtual pageview for App Router client navigations.
 * Configure a GTM Custom Event trigger on `virtualPageView` if needed.
 */
export function pushVirtualPageView(pagePath: string): boolean {
  const path = typeof pagePath === "string" ? pagePath.trim() : ""
  if (!path || path.length > MAX_STRING_LENGTH) {
    logDev("Skipped virtualPageView: invalid path", pagePath)
    return false
  }

  const payload: VirtualPageViewPayload = {
    event: "virtualPageView",
    page_path: path,
  }
  return pushDataLayer(payload)
}
