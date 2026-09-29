import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { calculateInstallmentChargeAmount } from "../installment-totals"

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
})
