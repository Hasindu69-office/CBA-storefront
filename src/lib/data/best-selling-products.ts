import { sdk } from "@lib/config"
import type { FeaturedProductCard } from "./featured-products"

type BestSellingProductsResponse =
  | {
      success: true
      data: {
        products: FeaturedProductCard[]
        count: number
        limit: number
        category_id: string
      }
    }
  | {
      success: false
      error: {
        message: string
      }
    }

export const listBestSellingProductCards = async ({
  sourceType,
  sourceId,
  categoryId,
  limit = 5,
}: {
  sourceType?: "category" | "brand" | "badge"
  sourceId?: string
  categoryId?: string
  limit?: number
}) => {
  const selectedSourceType = sourceType ?? "category"
  const selectedSourceId = (sourceId ?? categoryId ?? "").trim()
  if (!selectedSourceId) {
    return []
  }

  return sdk.client
    .fetch<BestSellingProductsResponse>("/store/cba/v1/products/best-selling", {
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
          payload.error?.message ?? "Best-selling product request failed."
        )
      }

      return payload.data.products
    })
}
