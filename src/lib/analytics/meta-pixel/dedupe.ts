const PURCHASE_PREFIX = "cba_meta_purchase:"

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/**
 * Returns true the first time this order id is claimed in the session.
 * Subsequent calls return false so Purchase is not double-fired on refresh.
 */
export function claimPurchaseEvent(orderId: string): boolean {
  const id = typeof orderId === "string" ? orderId.trim() : ""
  if (!id) return false

  const storage = getSessionStorage()
  const key = `${PURCHASE_PREFIX}${id}`

  if (!storage) {
    // No storage (private mode / SSR) — allow fire; Meta may still dedupe via eventID.
    return true
  }

  try {
    if (storage.getItem(key)) return false
    storage.setItem(key, "1")
    return true
  } catch {
    return true
  }
}

/** Test helper — clears a single purchase claim. */
export function clearPurchaseClaim(orderId: string): void {
  const id = typeof orderId === "string" ? orderId.trim() : ""
  if (!id) return
  const storage = getSessionStorage()
  if (!storage) return
  try {
    storage.removeItem(`${PURCHASE_PREFIX}${id}`)
  } catch {
    // ignore
  }
}
