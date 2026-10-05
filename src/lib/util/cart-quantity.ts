import type { HttpTypes } from "@medusajs/types"

export const MAX_CART_QUANTITY = 99

export function finiteVariantQuantity(
  variant: Pick<
    HttpTypes.StoreProductVariant,
    "manage_inventory" | "allow_backorder" | "inventory_quantity"
  > | null | undefined
) {
  if (!variant?.manage_inventory || variant.allow_backorder) return null

  const quantity = Number(variant.inventory_quantity)
  if (!Number.isFinite(quantity)) return null

  return Math.max(0, Math.min(MAX_CART_QUANTITY, Math.trunc(quantity)))
}

export function maxQuantityForVariant(
  variant: Pick<
    HttpTypes.StoreProductVariant,
    "manage_inventory" | "allow_backorder" | "inventory_quantity"
  > | null | undefined,
  quantityAlreadyInCart = 0
) {
  const stockQuantity = finiteVariantQuantity(variant)
  if (stockQuantity === null) return MAX_CART_QUANTITY

  return Math.max(
    0,
    Math.min(
      MAX_CART_QUANTITY,
      stockQuantity - Math.max(0, Math.trunc(quantityAlreadyInCart))
    )
  )
}

