import { normalizePromotionCode } from "@lib/util/promotions"

type PromotionLike = {
  code?: string | null
  is_automatic?: boolean | null
}

/** Manual (customer-entered) promotion codes currently on the cart. */
export function listManualPromotionCodes(
  promotions: PromotionLike[] | null | undefined
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
  promotions: PromotionLike[] | null | undefined
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
  promotions: PromotionLike[] | null | undefined,
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
  promotions: PromotionLike[] | null | undefined,
  removedCode: string
) {
  const normalizedRemovedCode = normalizePromotionCode(removedCode)
  return listManualPromotionCodes(promotions).filter(
    (code) => code !== normalizedRemovedCode
  )
}

export function hasAutomaticPromotions(
  promotions: PromotionLike[] | null | undefined
) {
  return promotions?.some((promotion) => promotion.is_automatic) ?? false
}
