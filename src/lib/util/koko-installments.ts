import type { VariantPrice } from "types/global"

export function kokoInstallmentLabel(price: VariantPrice | null | undefined) {
  if (!price || String(price.currency_code ?? "").toLowerCase() !== "lkr") {
    return null
  }
  const amount = Number(price.calculated_price_number)
  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }
  const installment = Math.ceil(amount / 3)
  return `Rs. ${installment.toLocaleString("en-US")}`
}

export function kokoInstallmentLabelFromAmount(
  amount: number | null | undefined,
  currencyCode: string | null | undefined
) {
  if (String(currencyCode ?? "").toLowerCase() !== "lkr") return null
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0) return null
  const installment = Math.ceil(value / 3)
  return `Rs. ${installment.toLocaleString("en-US")}`
}

export function kokoInstallmentCardLabelFromAmount(
  amount: number | null | undefined,
  currencyCode: string | null | undefined
) {
  if (String(currencyCode ?? "").toLowerCase() !== "lkr") return null
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0) return null
  const installment = value / 3
  return `LKR ${installment.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
