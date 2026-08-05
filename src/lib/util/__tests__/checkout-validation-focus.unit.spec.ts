import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { resolveCheckoutValidationFieldName } from "../checkout-validation-focus"

describe("resolveCheckoutValidationFieldName", () => {
  it("maps full name validation to the full_name input", () => {
    assert.equal(
      resolveCheckoutValidationFieldName("Full name is required."),
      "full_name"
    )
  })

  it("maps common shipping field messages", () => {
    assert.equal(
      resolveCheckoutValidationFieldName("Enter a valid email address."),
      "email"
    )
    assert.equal(
      resolveCheckoutValidationFieldName("Street address is required."),
      "shipping_address.address_1"
    )
    assert.equal(
      resolveCheckoutValidationFieldName("District is required."),
      "shipping_address.province"
    )
  })

  it("maps length errors and returns null for unknown messages", () => {
    assert.equal(
      resolveCheckoutValidationFieldName("postal_code is too long."),
      "shipping_address.postal_code"
    )
    assert.equal(resolveCheckoutValidationFieldName("Something else."), null)
    assert.equal(resolveCheckoutValidationFieldName(null), null)
  })
})
