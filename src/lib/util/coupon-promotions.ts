import { HttpTypes } from "@medusajs/types"

import { normalizePromotionCode } from "@lib/util/promotions"

/** Manual (customer-entered) promotion codes currently on the cart. */
export function listManualPromotionCodes(
  promotions: HttpTypes.StorePromotion[] | null | undefined
) {
  return (
    promotions
      ?.filter((promotion) => !promotion.is_automatic)
      .map((promotion) => promotion.code)
      .filter((code): code is string => Boolean(code))
      .map(normalizePromotionCode) ?? []
  )
}

/** All promotion codes on the cart, including automatic store offers. */
export function listAllPromotionCodes(
  promotions: HttpTypes.StorePromotion[] | null | undefined
) {
  return (
    promotions
      ?.map((promotion) => promotion.code)
      .filter((code): code is string => Boolean(code))
      .map(normalizePromotionCode) ?? []
  )
}

/** Payload for `applyPromotions()` when adding one manual coupon. */
export function manualCodesWithNewCoupon(
  promotions: HttpTypes.StorePromotion[] | null | undefined,
  newCode: string
) {
  const normalizedNewCode = normalizePromotionCode(newCode)
  const manualCodes = listManualPromotionCodes(promotions)

  if (manualCodes.includes(normalizedNewCode)) {
    return manualCodes
  }

  return [...manualCodes, normalizedNewCode]
}

/** Payload for `applyPromotions()` when removing one manual coupon. */
export function manualCodesWithoutCoupon(
  promotions: HttpTypes.StorePromotion[] | null | undefined,
  removedCode: string
) {
  const normalizedRemovedCode = normalizePromotionCode(removedCode)
  return listManualPromotionCodes(promotions).filter(
    (code) => code !== normalizedRemovedCode
  )
}

export function hasAutomaticPromotions(
  promotions: HttpTypes.StorePromotion[] | null | undefined
) {
  return promotions?.some((promotion) => promotion.is_automatic) ?? false
}
