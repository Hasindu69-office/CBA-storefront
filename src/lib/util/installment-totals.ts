export function calculateInstallmentChargeAmount(
  amount: number,
  feePercentage: number
) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Installment amount is invalid.")
  }
  if (!Number.isFinite(feePercentage) || feePercentage < 0) {
    throw new Error("Installment fee percentage is invalid.")
  }
  // Keep this identical to the backend WEBXPAY charge calculation.
  return Math.round(amount * (1 + feePercentage / 100) * 100) / 100
}

export type CartInstallmentPricing = {
  base_amount: number
  installment_basis_amount: number
  installment_fee_amount: number
  installment_charge_amount: number
  monthly_amount?: number
}

export function calculateCartInstallmentPricing(input: {
  baseAmount: number
  feePercentage: number
  tenorMonths?: number
}): CartInstallmentPricing {
  const values = [input.baseAmount, input.feePercentage]
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Installment pricing is invalid.")
  }
  if (
    input.tenorMonths !== undefined &&
    (!Number.isInteger(input.tenorMonths) || input.tenorMonths < 1)
  ) {
    throw new Error("Installment tenor is invalid.")
  }

  const basis = roundMoney(input.baseAmount)
  const fee = roundMoney(basis * (input.feePercentage / 100))
  const charge = roundMoney(input.baseAmount + fee)
  return {
    base_amount: roundMoney(input.baseAmount),
    installment_basis_amount: basis,
    installment_fee_amount: fee,
    installment_charge_amount: charge,
    ...(input.tenorMonths === undefined
      ? {}
      : { monthly_amount: roundMoney(charge / input.tenorMonths) }),
  }
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
