export type StoreFilterNavigationOptions = {
  pathname: string
  searchParams: URLSearchParams
  nextCategories: string[]
  routeCategoryHandle?: string
  exitPath?: string
}

export type StoreFilterResetOptions = {
  pathname: string
  searchParams: URLSearchParams
  routeCategoryHandle?: string
  exitPath?: string
}

export function buildStoreCategoryFilterHref({
  pathname,
  searchParams,
  nextCategories,
  routeCategoryHandle,
  exitPath = "/store",
}: StoreFilterNavigationOptions) {
  const params = new URLSearchParams(searchParams)
  const normalizedCategories = Array.from(
    new Set(nextCategories.map((category) => category.trim()).filter(Boolean))
  )

  if (normalizedCategories.length) {
    params.set("category", normalizedCategories.join(","))
  } else {
    params.delete("category")
  }

  params.delete("page")

  const targetPath =
    routeCategoryHandle && !normalizedCategories.includes(routeCategoryHandle)
      ? exitPath
      : pathname

  return buildStoreFilterHref(targetPath, params)
}

export function buildStoreFilterResetHref({
  pathname,
  searchParams,
  routeCategoryHandle,
  exitPath = "/store",
}: StoreFilterResetOptions) {
  const params = new URLSearchParams(searchParams)
  params.delete("category")
  params.delete("brand")
  params.delete("min_price")
  params.delete("max_price")
  params.delete("price_range")
  params.delete("filters")
  params.delete("sortBy")
  params.delete("page")

  const targetPath = routeCategoryHandle ? exitPath : pathname
  return buildStoreFilterHref(targetPath, params)
}

const MAX_STORE_FILTER_TOKEN_LENGTH = 255

/**
 * Clean store URL filtered to a single brand slug. Returns null when the slug
 * is empty or exceeds the store multi-select token limit.
 */
export function buildStoreBrandQueryHref(brandSlug: string): string | null {
  return buildStoreSingleFilterQueryHref("brand", brandSlug)
}

/**
 * Clean store URL filtered to a single category handle. Returns null when the
 * handle is empty or exceeds the store multi-select token limit.
 */
export function buildStoreCategoryQueryHref(
  categoryHandle: string
): string | null {
  return buildStoreSingleFilterQueryHref("category", categoryHandle)
}

export function isValidStoreFilterToken(value?: string | null): value is string {
  const text = value?.trim()
  return Boolean(text && text.length <= MAX_STORE_FILTER_TOKEN_LENGTH)
}

function buildStoreSingleFilterQueryHref(
  key: "brand" | "category",
  tokenValue: string
): string | null {
  const token = tokenValue?.trim()
  if (!token || token.length > MAX_STORE_FILTER_TOKEN_LENGTH) {
    return null
  }
  return `/store?${key}=${encodeURIComponent(token)}`
}

function buildStoreFilterHref(pathname: string, params: URLSearchParams) {
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
