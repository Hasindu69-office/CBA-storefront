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

  it("applies the fee to the cart grand total", () => {
    assert.deepEqual(calculateCartInstallmentPricing({
      baseAmount: 10.5,
      feePercentage: 6.5,
      tenorMonths: 6,
    }), {
      base_amount: 10.5,
      installment_basis_amount: 10.5,
      installment_fee_amount: 0.68,
      installment_charge_amount: 11.18,
      monthly_amount: 1.86,
    })
  })

  it("fees the full base amount including tax and shipping", () => {
    assert.equal(calculateCartInstallmentPricing({
      baseAmount: 1520,
      feePercentage: 10,
    }).installment_fee_amount, 152)
  })

  it("rejects invalid tenor", () => {
    assert.throws(() => calculateCartInstallmentPricing({
      baseAmount: 100,
      feePercentage: 5,
      tenorMonths: 0,
    }))
  })

})
