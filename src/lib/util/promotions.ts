export const PROMOTION_CODE_MAX_LENGTH = 64
export const PROMOTION_CODE_MAX_COUNT = 5

const safePromotionCode = /^[A-Z0-9][A-Z0-9_-]{0,63}$/
const unsafeDetails =
  /sql|database|stack|node_modules|secret|token|password|redis|provider|file|path|campaign budget|internal|query/i

export function normalizePromotionCode(code: string) {
  return code.trim().toUpperCase()
}

export function validatePromotionCode(code: string, appliedCodes: string[] = []) {
  const normalizedCode = normalizePromotionCode(code)

  if (!normalizedCode) {
    return { code: normalizedCode, error: "Enter a coupon code." }
  }
  if (/[\u0000-\u001F\u007F]/.test(normalizedCode)) {
    return {
      code: normalizedCode,
      error: "Coupon code contains unsupported characters.",
    }
  }
  if (normalizedCode.length > PROMOTION_CODE_MAX_LENGTH) {
    return { code: normalizedCode, error: "Coupon code is too long." }
  }
  if (!safePromotionCode.test(normalizedCode)) {
    return {
      code: normalizedCode,
      error: "Coupon code can use letters, numbers, hyphens, and underscores.",
    }
  }
  if (appliedCodes.map(normalizePromotionCode).includes(normalizedCode)) {
    return { code: normalizedCode, error: "Coupon code is already applied." }
  }

  return { code: normalizedCode, error: null }
}

export function normalizePromotionCodes(codes: string[]) {
  if (codes.length > PROMOTION_CODE_MAX_COUNT) {
    throw new Error(`You can apply up to ${PROMOTION_CODE_MAX_COUNT} coupon codes.`)
  }

  const normalizedCodes = codes
    .map(normalizePromotionCode)
    .filter(Boolean)

  const uniqueCodes = Array.from(new Set(normalizedCodes))
  if (uniqueCodes.length !== normalizedCodes.length) {
    throw new Error("Coupon code is already applied.")
  }

  for (const code of uniqueCodes) {
    const result = validatePromotionCode(code)
    if (result.error) {
      throw new Error(result.error)
    }
  }

  return uniqueCodes
}

export function safePromotionError(error: unknown) {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "This promotion could not be applied to your cart."

  if (unsafeDetails.test(rawMessage)) {
    return new Error("This promotion could not be applied to your cart.")
  }

  if (/not.?found|inactive|expired|not eligible|invalid|promotion|coupon/i.test(rawMessage)) {
    return new Error(rawMessage.trim() || "This promotion could not be applied to your cart.")
  }

  return new Error("This promotion could not be applied to your cart.")
}
