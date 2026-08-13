"use server"

import { sdk } from "@lib/config"
import type { ProductDetailRelatedProduct } from "@lib/data/product-detail"

export type ProductRelationshipsResponse = {
  type: string | null
  products: ProductDetailRelatedProduct[]
  count: number
  limit: number
  offset: number
}

export async function listProductRelationships(
  productId: string,
  {
    type,
    limit = 8,
    offset = 0,
  }: {
    type: "related" | "cross_sell" | "up_sell" | "accessory"
    limit?: number
    offset?: number
  }
): Promise<ProductRelationshipsResponse> {
  return sdk.client.fetch<ProductRelationshipsResponse>(
    `/store/cba/v1/products/${productId}/relationships`,
    {
      cache: "no-store",
      query: {
        type,
        limit,
        offset,
      },
    }
  )
}
