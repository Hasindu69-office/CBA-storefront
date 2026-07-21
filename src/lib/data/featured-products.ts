import { sdk } from "@lib/config"

export type FeaturedProductCard = {
  id: string
  product_id: string
  handle: string
  title: string
  subtitle: string | null
  thumbnail: { url: string; alt: string } | null
  brand: {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    logo_alt_text?: string | null
  } | null
  category: { id: string; name: string; handle: string } | null
  default_variant: { id: string; title: string; sku: string | null } | null
  price: {
    currency_code: string
    calculated_amount: number | null
    original_amount: number | null
    has_discount: boolean
    discount_percentage: number | null
    tax_inclusive: boolean | null
    status: "available" | "unavailable" | "context_required" | "error"
    reason: string | null
  }
  inventory: {
    managed: boolean
    available_quantity: number | null
    allow_backorder: boolean
    in_stock: boolean
    purchasable: boolean
    status:
      | "in_stock"
      | "low_stock"
      | "out_of_stock"
      | "backorder"
      | "not_managed"
      | "unavailable"
    reason: string | null
  }
  badges: Array<{
    key: string
    label: string
    priority: number
    style_token?: BadgeStyleToken | null
  }>
  rating: { average: number; count: number } | null
  compare_group_keys: string[]
  updated_at: string
}

export type BadgeStyleToken =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "info"
  | "neutral"

type FeaturedProductsResponse =
  | {
      success: true
      data: {
        products: FeaturedProductCard[]
        count: number
        limit: number
      }
    }
  | {
      success: false
      error: {
        message: string
      }
    }

export const listFeaturedProductCards = async (limit = 12) => {
  return sdk.client
    .fetch<FeaturedProductsResponse>("/store/cba/v1/products/featured", {
      cache: "no-store",
      query: {
        limit,
      },
    })
    .then((payload) => {
      if (!payload.success) {
        throw new Error(
          payload.error?.message ?? "Featured product request failed."
        )
      }

      return payload.data.products
    })
}
