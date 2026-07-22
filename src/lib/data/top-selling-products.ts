import { sdk } from "@lib/config"
import type { FeaturedProductCard } from "./featured-products"

type TopSellingProductsResponse =
  | {
      success: true
      data: {
        products: FeaturedProductCard[]
        count: number
        limit: number
        source_type: string
        source_id: string
        category_id?: string
      }
    }
  | {
      success: false
      error: {
        message: string
      }
    }

export const listTopSellingProductCards = async ({
  sourceType,
  sourceId,
  limit = 12,
}: {
  sourceType?: "category" | "brand" | "badge"
  sourceId?: string
  limit?: number
}) => {
  const selectedSourceType = sourceType ?? "category"
  const selectedSourceId = (sourceId ?? "").trim()
  if (!selectedSourceId) {
    return []
  }

  return sdk.client
    .fetch<TopSellingProductsResponse>("/store/cba/v1/products/top-selling", {
      cache: "no-store",
      query: {
        source_type: selectedSourceType,
        source_id: selectedSourceId,
        category_id:
          selectedSourceType === "category" ? selectedSourceId : undefined,
        limit,
      },
    })
    .then((payload) => {
      if (!payload.success) {
        throw new Error(
          payload.error?.message ?? "Top-selling product request failed."
        )
      }

      return payload.data.products
    })
}
