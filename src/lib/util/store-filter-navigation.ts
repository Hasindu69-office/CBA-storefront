export type StoreFilterNavigationOptions = {
  pathname: string
  searchParams: URLSearchParams
  nextCategories: string[]
  routeCategoryId?: string
  exitPath?: string
}

export type StoreFilterResetOptions = {
  pathname: string
  searchParams: URLSearchParams
  routeCategoryId?: string
  exitPath?: string
}

export function buildStoreCategoryFilterHref({
  pathname,
  searchParams,
  nextCategories,
  routeCategoryId,
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
    routeCategoryId && !normalizedCategories.includes(routeCategoryId)
      ? exitPath
      : pathname

  return buildStoreFilterHref(targetPath, params)
}

export function buildStoreFilterResetHref({
  pathname,
  searchParams,
  routeCategoryId,
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

  const targetPath = routeCategoryId ? exitPath : pathname
  return buildStoreFilterHref(targetPath, params)
}

function buildStoreFilterHref(pathname: string, params: URLSearchParams) {
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
