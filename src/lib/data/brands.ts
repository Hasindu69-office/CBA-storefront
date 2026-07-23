import { sdk } from "@lib/config"

export type StorefrontBrand = {
  id: string
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  logo_alt_text?: string | null
  website_url?: string | null
  homepage_visible: boolean
  homepage_sort_order?: number | null
  updated_at?: string
}

type BrandListResponse = {
  brands: StorefrontBrand[]
  count: number
  limit: number
  offset: number
}

export const listHomepageBrands = async ({ limit = 24 }: { limit?: number }) => {
  const safeLimit = Number.isInteger(limit)
    ? Math.min(Math.max(limit, 1), 24)
    : 24

  return sdk.client
    .fetch<BrandListResponse>("/store/cba/v1/brands", {
      cache: "no-store",
      query: {
        homepage_visible: true,
        sort: "homepage_sort_order",
        limit: safeLimit,
      },
    })
    .then((payload) =>
      payload.brands.filter(
        (brand) =>
          Boolean(brand.logo_url) &&
          Boolean(brand.slug?.trim()) &&
          Boolean(brand.name?.trim())
      )
    )
}

export const listStoreBrands = async ({ limit = 100 }: { limit?: number } = {}) => {
  const safeLimit = Number.isInteger(limit)
    ? Math.min(Math.max(limit, 1), 100)
    : 100

  return sdk.client
    .fetch<BrandListResponse>("/store/cba/v1/brands", {
      cache: "no-store",
      query: {
        sort: "list_sort_order",
        limit: safeLimit,
      },
    })
    .then((payload) =>
      payload.brands.filter(
        (brand) => Boolean(brand.id) && Boolean(brand.name?.trim())
      )
    )
}
