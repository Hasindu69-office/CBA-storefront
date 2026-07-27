export const COMPARE_STORAGE_KEY = "cba_compare_product_ids_v1"
const COMPARE_HINTS_STORAGE_KEY = "cba_compare_product_hints_v1"
export const LEGACY_COMPARE_STORAGE_KEY = "cba_compare_products"
export const DEFAULT_COMPARE_LIMIT = 4
export const MAX_COMPARE_LIMIT = 6

const PRODUCT_ID_PATTERN = /^prod_[A-Za-z0-9_-]+$/

export type CompareProductHint = {
  id: string
  compareGroupKeys?: string[]
}

export type CompareUpdateResult =
  | {
      success: true
      ids: string[]
      message: string
    }
  | {
      success: false
      ids: string[]
      message: string
    }

export function isSafeCompareProductId(value: string) {
  return PRODUCT_ID_PATTERN.test(value)
}

export function normalizeCompareIds(
  value: string | string[] | null | undefined,
  limit = MAX_COMPARE_LIMIT
) {
  const raw = Array.isArray(value) ? value.join(",") : value ?? ""
  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter(isSafeCompareProductId)

  return uniqueInOrder(ids).slice(0, clampCompareLimit(limit))
}

export function parseCompareStorageValue(value: string | null) {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return normalizeCompareIds(parsed.map(String).join(","))
    }
  } catch {}

  return normalizeCompareIds(value)
}

export function readStoredCompareIds() {
  if (typeof window === "undefined") {
    return []
  }

  const ids = parseCompareStorageValue(
    window.localStorage.getItem(COMPARE_STORAGE_KEY)
  )
  if (ids.length) {
    return ids
  }

  const legacyIds = parseCompareStorageValue(
    window.localStorage.getItem(LEGACY_COMPARE_STORAGE_KEY)
  )
  if (legacyIds.length) {
    writeStoredCompareIds(legacyIds)
    window.localStorage.removeItem(LEGACY_COMPARE_STORAGE_KEY)
  }
  return legacyIds
}

export function writeStoredCompareIds(ids: string[]) {
  if (typeof window === "undefined") {
    return
  }

  const normalized = normalizeCompareIds(ids.join(","))
  window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(normalized))
}

export function addProductToCompareStorage(
  product: CompareProductHint,
  options: {
    limit?: number
  } = {}
): CompareUpdateResult {
  const currentIds = readStoredCompareIds()
  if (!isSafeCompareProductId(product.id)) {
    return {
      success: false,
      ids: currentIds,
      message: "Select a valid product to compare.",
    }
  }

  if (currentIds.includes(product.id)) {
    return {
      success: true,
      ids: currentIds,
      message: "Product is already in compare.",
    }
  }

  const limit = clampCompareLimit(options.limit ?? DEFAULT_COMPARE_LIMIT)
  if (currentIds.length >= limit) {
    return {
      success: false,
      ids: currentIds,
      message: `Compare supports up to ${limit} products.`,
    }
  }

  const hints = readCompareHints()
  const existingGroupKeys = currentIds.flatMap((id) => hints[id] ?? [])
  if (
    existingGroupKeys.length &&
    product.compareGroupKeys?.length &&
    !product.compareGroupKeys.some((key) => existingGroupKeys.includes(key))
  ) {
    return {
      success: false,
      ids: currentIds,
      message: "This product belongs to a different compare group.",
    }
  }

  const nextIds = [...currentIds, product.id]
  writeStoredCompareIds(nextIds)
  writeCompareHint(product)
  return {
    success: true,
    ids: nextIds,
    message: "Added to compare.",
  }
}

export function removeProductFromCompareStorage(productId: string) {
  const nextIds = readStoredCompareIds().filter((id) => id !== productId)
  writeStoredCompareIds(nextIds)
  removeCompareHint(productId)
  return nextIds
}

export function compareIdsQuery(ids: string[]) {
  return normalizeCompareIds(ids.join(",")).join(",")
}

export function clampCompareLimit(value: number) {
  if (!Number.isInteger(value)) {
    return DEFAULT_COMPARE_LIMIT
  }
  return Math.min(MAX_COMPARE_LIMIT, Math.max(2, value))
}

function uniqueInOrder(values: string[]) {
  return Array.from(new Set(values))
}

function readCompareHints(): Record<string, string[]> {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(COMPARE_HINTS_STORAGE_KEY) ?? "{}"
    )
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {}
    }
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([id]) => isSafeCompareProductId(id))
        .map(([id, keys]) => [
          id,
          Array.isArray(keys)
            ? keys
                .map((key) => String(key).trim())
                .filter((key) => key.length > 0 && key.length <= 255)
                .slice(0, 6)
            : [],
        ])
    )
  } catch {
    return {}
  }
}

function writeCompareHint(product: CompareProductHint) {
  if (typeof window === "undefined") {
    return
  }

  const keys = (product.compareGroupKeys ?? [])
    .map((key) => key.trim())
    .filter(Boolean)
    .slice(0, 6)
  if (!keys.length) {
    return
  }

  const hints = readCompareHints()
  hints[product.id] = keys
  window.localStorage.setItem(COMPARE_HINTS_STORAGE_KEY, JSON.stringify(hints))
}

function removeCompareHint(productId: string) {
  if (typeof window === "undefined") {
    return
  }

  const hints = readCompareHints()
  delete hints[productId]
  window.localStorage.setItem(COMPARE_HINTS_STORAGE_KEY, JSON.stringify(hints))
}
