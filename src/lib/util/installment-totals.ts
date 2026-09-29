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
