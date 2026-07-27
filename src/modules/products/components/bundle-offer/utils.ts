import type { FeaturedProductCard } from "@lib/data/featured-products"

export type BundleCategoryKey = "cross_sell" | "accessory" | "up_sell"

export type BundleSelection = {
  includeMain: boolean
  companions: Record<string, boolean>
}

export type BundleCategory = {
  key: BundleCategoryKey
  title: string
  companions: FeaturedProductCard[]
}

export const BUNDLE_CATEGORIES: Array<{
  key: BundleCategoryKey
  title: string
}> = [
  { key: "cross_sell", title: "Frequently Bought Together" },
  { key: "accessory", title: "Accessories" },
  { key: "up_sell", title: "Upgrade Options" },
]

export function isCompanionPurchasable(item: FeaturedProductCard) {
  return (
    Boolean(item.default_variant?.id) &&
    item.inventory.purchasable &&
    item.price.status === "available" &&
    item.price.calculated_amount !== null
  )
}

export function createInitialSelection(
  companions: FeaturedProductCard[]
): BundleSelection {
  return {
    includeMain: true,
    companions: Object.fromEntries(
      companions.map((item) => [item.id, isCompanionPurchasable(item)])
    ),
  }
}

export function buildSelectedItems({
  selection,
  productId,
  mainVariantId,
  mainPurchasable,
  mainValid,
  quantity,
  companions,
}: {
  selection: BundleSelection
  productId: string
  mainVariantId?: string
  mainPurchasable: boolean
  mainValid: boolean
  quantity: number
  companions: FeaturedProductCard[]
}) {
  const items: Array<{ productId: string; variantId: string; quantity: number }> = []

  if (selection.includeMain && mainVariantId && mainPurchasable && mainValid) {
    items.push({
      productId,
      variantId: mainVariantId,
      quantity,
    })
  }

  for (const item of companions) {
    if (
      selection.companions[item.id] &&
      isCompanionPurchasable(item) &&
      item.default_variant?.id
    ) {
      items.push({
        productId: item.product_id,
        variantId: item.default_variant.id,
        quantity: 1,
      })
    }
  }

  return items
}

export function calculateBundleTotal({
  selection,
  mainPrice,
  mainPurchasable,
  quantity,
  companions,
}: {
  selection: BundleSelection
  mainPrice: number | null
  mainPurchasable: boolean
  quantity: number
  companions: FeaturedProductCard[]
}) {
  let sum = 0

  if (selection.includeMain && mainPurchasable && mainPrice !== null) {
    sum += mainPrice * quantity
  }

  for (const item of companions) {
    if (
      selection.companions[item.id] &&
      isCompanionPurchasable(item) &&
      item.price.calculated_amount !== null
    ) {
      sum += item.price.calculated_amount
    }
  }

  return sum
}
