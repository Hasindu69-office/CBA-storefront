import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  calculateCartInstallmentPricing,
  calculateInstallmentChargeAmount,
} from "../installment-totals"

describe("installment checkout totals", () => {
  it("matches the backend percentage and currency rounding", () => {
    assert.equal(calculateInstallmentChargeAmount(100_000, 13.5), 113_500)
    assert.equal(calculateInstallmentChargeAmount(999.99, 12.5), 1124.99)
  })

  it("supports zero-fee plans and rejects invalid values", () => {
    assert.equal(calculateInstallmentChargeAmount(1000, 0), 1000)
    assert.throws(() => calculateInstallmentChargeAmount(-1, 10))
    assert.throws(() => calculateInstallmentChargeAmount(1000, Number.NaN))
  })

  it("charges only discounted pre-tax merchandise", () => {
    assert.deepEqual(calculateCartInstallmentPricing({
      baseAmount: 405,
      itemTotal: 5,
      itemTaxTotal: 0,
      feePercentage: 13.5,
      tenorMonths: 12,
    }), {
      base_amount: 405,
      installment_basis_amount: 5,
      installment_fee_amount: 0.68,
      installment_charge_amount: 405.68,
      monthly_amount: 33.81,
    })
  })

  it("excludes product tax and rejects inconsistent totals", () => {
    assert.equal(calculateCartInstallmentPricing({
      baseAmount: 1520,
      itemTotal: 1020,
      itemTaxTotal: 20,
      feePercentage: 10,
    }).installment_fee_amount, 100)
    assert.throws(() => calculateCartInstallmentPricing({
      baseAmount: 100,
      itemTotal: 10,
      itemTaxTotal: 11,
      feePercentage: 5,
    }))
  })

})
