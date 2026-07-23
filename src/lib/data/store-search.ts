import { sdk } from "@lib/config"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import { getRegion } from "@lib/data/regions"

export type StoreSearchSort = "relevance" | "newest" | "title" | "-title"

export type StoreSearchFacet = {
  key: string
  options: Array<{ value: string; count: number }>
}

export type StoreSearchFilters = Record<string, string[]>
export type StoreSearchResult = {
  products: FeaturedProductCard[]
  count: number
  limit: number
  offset: number
  price_range?: {
    min: number | null
    max: number | null
  }
}

type StoreSearchResponse =
  | {
      success: true
      data: StoreSearchResult
    }
  | {
      success: false
      error: { message: string }
    }

type StoreSearchFacetsResponse =
  | {
      success: true
      data: { facets: StoreSearchFacet[] }
    }
  | {
      success: false
      error: { message: string }
    }

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 60
const SORT_VALUES = new Set<StoreSearchSort>([
  "relevance",
  "newest",
  "title",
  "-title",
])

export async function searchStoreProducts({
  q,
  page = 1,
  limit = DEFAULT_LIMIT,
  sort = "relevance",
  category,
  brand,
  filters = {},
  minPrice,
  maxPrice,
  countryCode,
}: {
  q?: string
  page?: number
  limit?: number
  sort?: StoreSearchSort
  category?: string
  brand?: string
  filters?: StoreSearchFilters
  minPrice?: number
  maxPrice?: number
  countryCode: string
}) {
  const safeLimit = normalizeLimit(limit)
  const safePage = Number.isInteger(page) && page > 0 ? page : 1
  const region = await getRegion(countryCode)
  const payload = await sdk.client.fetch<StoreSearchResponse>(
    "/store/cba/v1/search",
    {
      cache: "no-store",
      query: cleanQuery({
        q: cleanSearchQuery(q),
        limit: safeLimit,
        offset: (safePage - 1) * safeLimit,
        sort: SORT_VALUES.has(sort) ? sort : "relevance",
        category: cleanToken(category),
        brand: cleanToken(brand),
        min_price: normalizePriceBound(minPrice),
        max_price: normalizePriceBound(maxPrice),
        filters: serializeFilters(filters),
        country_code: countryCode,
        region_id: region?.id,
        currency_code: region?.currency_code,
      }),
    }
  )

  if (!payload.success) {
    throw new Error(payload.error?.message ?? "Product search request failed.")
  }

  return payload.data
}

export function parseStorePriceBound(value?: string) {
  if (!value?.trim()) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 100_000_000
    ? parsed
    : undefined
}

export async function listStoreSearchFacets({
  q,
  category,
  brand,
}: {
  q?: string
  category?: string
  brand?: string
}) {
  const payload = await sdk.client.fetch<StoreSearchFacetsResponse>(
    "/store/cba/v1/search/facets",
    {
      cache: "no-store",
      query: cleanQuery({
        q: cleanSearchQuery(q),
        category: cleanToken(category),
        brand: cleanToken(brand),
      }),
    }
  )

  if (!payload.success) {
    throw new Error(payload.error?.message ?? "Search facets request failed.")
  }

  return payload.data.facets
}

export function parseStoreSearchSort(value?: string): StoreSearchSort {
  return SORT_VALUES.has(value as StoreSearchSort)
    ? (value as StoreSearchSort)
    : "relevance"
}

export function parseStorePage(value?: string) {
  const parsed = Number(value ?? 1)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export function parseStoreFilters(value?: string): StoreSearchFilters {
  if (!value?.trim()) {
    return {}
  }
  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {}
    }
    const filters: StoreSearchFilters = {}
    for (const [key, item] of Object.entries(parsed)) {
      const safeKey = normalizeFilterToken(key)
      if (!safeKey) continue
      const values = (Array.isArray(item) ? item : [item])
        .map((value) => normalizeFilterToken(String(value)))
        .filter(Boolean)
      if (values.length) {
        filters[safeKey] = Array.from(new Set(values)).slice(0, 20)
      }
    }
    return Object.fromEntries(Object.entries(filters).slice(0, 20))
  } catch {
    return {}
  }
}

function normalizeLimit(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_LIMIT
    ? value
    : DEFAULT_LIMIT
}

function normalizePriceBound(value?: number) {
  if (value === undefined) {
    return undefined
  }
  return Number.isInteger(value) && value >= 0 && value <= 100_000_000
    ? value
    : undefined
}

function serializeFilters(filters: StoreSearchFilters) {
  const normalized = parseStoreFilters(JSON.stringify(filters))
  return Object.keys(normalized).length ? JSON.stringify(normalized) : undefined
}

function cleanSearchQuery(value?: string) {
  const text = value?.trim()
  return text ? text.slice(0, 120) : undefined
}

function cleanToken(value?: string) {
  const text = value?.trim()
  return text && text.length <= 255 ? text : undefined
}

function normalizeFilterToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function cleanQuery(query: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  )
}
