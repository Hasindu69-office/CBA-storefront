import type { HttpTypes } from "@medusajs/types"

export function visibleVariantTitle(title?: string | null): string | null {
  const value = title?.trim()
  return !value || /^(default(?: variant)?|n\/a)$/i.test(value) ? null : value
}

export function visibleProductOptions(options: HttpTypes.StoreProduct["options"]) {
  return (options ?? []).filter((option) =>
    visibleVariantTitle(option.title) !== null ||
    (option.values ?? []).some((value) => visibleVariantTitle(value.value) !== null)
  )
}

export function variantOptionsMap(options: HttpTypes.StoreProductVariant["options"]) {
  return (options ?? []).reduce<Record<string, string>>((result, option) => {
    if (option.option_id) result[option.option_id] = option.value
    return result
  }, {})
}

export function hasPurchasablePrice(variant?: HttpTypes.StoreProductVariant) {
  const price = variant?.calculated_price
  return typeof price?.calculated_amount === "number" &&
    Number.isFinite(price.calculated_amount) && price.calculated_amount >= 0 &&
    Boolean(price.currency_code)
}
