import { sdk } from "@lib/config"
import type { FeaturedProductCard } from "./featured-products"

export type TabbedSaleProductSourceType = "category" | "brand" | "badge"
export type TabbedSaleProductTabKey =
  | "featured"
  | "new_arrivals"
  | "best_sellers"
  | "top_rated"

type TabbedSaleProductsResponse =
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

export const listTabbedSaleProductCards = async ({
  sourceType,
  sourceId,
  limit = 4,
  tabKey = "featured",
}: {
  tabKey?: TabbedSaleProductTabKey
  sourceType?: TabbedSaleProductSourceType
  sourceId?: string
  limit?: number
}) => {
  const selectedSourceType = sourceType ?? "badge"
  const selectedSourceId = (sourceId ?? "").trim()

  return sdk.client
    .fetch<TabbedSaleProductsResponse>("/store/cba/v1/products/tabbed-sale", {
      cache: "no-store",
      query: {
        tab_key: tabKey,
        source_type: selectedSourceId ? selectedSourceType : undefined,
        source_id: selectedSourceId || undefined,
        category_id:
          selectedSourceType === "category" && selectedSourceId
            ? selectedSourceId
            : undefined,
        limit,
      },
    })
    .then((payload) => {
      if (!payload.success) {
        throw new Error(
          payload.error?.message ?? "Sale product request failed."
        )
      }

      return payload.data.products
    })
}

type ProductCardsResponse =
  | {
      success: true
      data: {
        products: FeaturedProductCard[]
      }
    }
  | {
      success: false
      error: {
        message: string
      }
    }

export const listProductCardsByIds = async (ids: string[]) => {
  const selectedIds = ids.map((id) => id.trim()).filter(Boolean)
  if (!selectedIds.length) {
    return []
  }

  return sdk.client
    .fetch<ProductCardsResponse>("/store/cba/v1/products/cards", {
      cache: "no-store",
      query: {
        ids: selectedIds.join(","),
      },
    })
    .then((payload) => {
      if (!payload.success) {
        throw new Error(
          payload.error?.message ?? "Product card request failed."
        )
      }

      return payload.data.products
    })
}
