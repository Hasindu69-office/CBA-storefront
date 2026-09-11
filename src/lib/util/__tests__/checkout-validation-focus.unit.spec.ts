import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { validateCheckoutAddressFormData } from "../checkout-address-validation"
import { resolveCheckoutValidationFieldName } from "../checkout-validation-focus"
import {
  normalizeSriLankanPhone,
  sanitizeSriLankanPhoneInput,
  sanitizeSriLankanPhoneNationalInput,
  toSriLankanPhoneNational,
  validateSriLankanPhone,
} from "../storefront-form-validation"

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

describe("validateCheckoutAddressFormData", () => {
  it("returns field errors for an empty checkout address form", () => {
    const result = validateCheckoutAddressFormData(new FormData())

    assert.equal(result.ok, false)
    assert.equal(result.fieldErrors.full_name, "Full name is required.")
    assert.equal(result.fieldErrors.email, "Enter a valid email address.")
    assert.equal(
      result.fieldErrors["shipping_address.phone"],
      "Enter a valid Sri Lankan phone number."
    )
    assert.equal(
      result.fieldErrors["shipping_address.address_1"],
      "Street address is required."
    )
    assert.equal(result.fieldErrors["shipping_address.city"], "City is required.")
    assert.equal(
      result.fieldErrors["shipping_address.province"],
      "District is required."
    )
    assert.equal(
      result.fieldErrors["shipping_address.postal_code"],
      "Postal code is required."
    )
  })

  it("rejects invalid email, phone, postal code, and delivery instructions", () => {
    const formData = validCheckoutAddressFormData()
    formData.set("email", "not-email")
    formData.set("shipping_address.phone", "123")
    formData.set("shipping_address.postal_code", "###")
    formData.set("delivery_instructions", "<script>")

    const result = validateCheckoutAddressFormData(formData)

    assert.equal(result.ok, false)
    assert.equal(result.fieldErrors.email, "Enter a valid email address.")
    assert.equal(
      result.fieldErrors["shipping_address.phone"],
      "Use Sri Lankan phone format +94768545236."
    )
    assert.equal(
      result.fieldErrors["shipping_address.postal_code"],
      "Enter a valid 5-digit Sri Lankan postal code."
    )
    assert.equal(
      result.fieldErrors.delivery_instructions,
      "Delivery instructions contain invalid characters."
    )
  })

  it("rejects names with numbers and local phone formats", () => {
    const formData = validCheckoutAddressFormData()
    formData.set("full_name", "1234asdf")
    formData.set("shipping_address.phone", "0768545236")

    const result = validateCheckoutAddressFormData(formData)

    assert.equal(result.ok, false)
    assert.equal(
      result.fieldErrors.full_name,
      "Full name must start with a letter and cannot contain numbers."
    )
    assert.equal(
      result.fieldErrors["shipping_address.phone"],
      "Use Sri Lankan phone format +94768545236 or +94112365869."
    )
  })

  it("accepts a valid Sri Lankan checkout address with a mobile number", () => {
    const result = validateCheckoutAddressFormData(validCheckoutAddressFormData())

    assert.equal(result.ok, true)
    assert.equal(result.values.email, "customer@example.com")
    assert.equal(result.values.country_code, "lk")
  })

  it("accepts a valid Sri Lankan checkout address with a fixed-line number", () => {
    const formData = validCheckoutAddressFormData()
    formData.set("shipping_address.phone", "+94112365869")

    const result = validateCheckoutAddressFormData(formData)

    assert.equal(result.ok, true)
    assert.equal(result.values.phone, "+94112365869")
  })

  it("rejects delivery instructions over 500 characters", () => {
    const formData = validCheckoutAddressFormData()
    formData.set("delivery_instructions", "a".repeat(501))

    const result = validateCheckoutAddressFormData(formData)

    assert.equal(result.ok, false)
    assert.equal(
      result.fieldErrors.delivery_instructions,
      "Delivery instructions must be between 1 and 500 characters."
    )
  })
})

describe("validateSriLankanPhone", () => {
  it("accepts mobile and representative fixed-line numbers", () => {
    assert.equal(validateSriLankanPhone("+94768545236"), null)
    assert.equal(validateSriLankanPhone("+94112365869"), null)
    assert.equal(validateSriLankanPhone("+94812345678"), null)
    assert.equal(validateSriLankanPhone("+94912345678"), null)
    assert.equal(validateSriLankanPhone("+94312345678"), null)
  })

  it("rejects local, missing-plus, service, and malformed numbers", () => {
    const error = "Use Sri Lankan phone format +94768545236 or +94112365869."
    assert.equal(validateSriLankanPhone("0768545236"), error)
    assert.equal(validateSriLankanPhone("0112365869"), error)
    assert.equal(validateSriLankanPhone("94112365869"), error)
    assert.equal(validateSriLankanPhone("+941123"), error)
    assert.equal(validateSriLankanPhone("+941192"), error)
    assert.equal(validateSriLankanPhone("+941102365869"), error)
    assert.equal(validateSriLankanPhone("+94192365869"), error)
    assert.equal(validateSriLankanPhone("+94800123456"), error)
  })

  it("sanitizes characters without converting local or missing-plus input", () => {
    assert.equal(sanitizeSriLankanPhoneInput("+94 11 236 5869"), "+94112365869")
    assert.equal(sanitizeSriLankanPhoneInput("0112365869"), "0112365869")
    assert.equal(sanitizeSriLankanPhoneInput("94112365869"), "94112365869")
  })

  it("converts between the displayed national number and the stored international number", () => {
    assert.equal(toSriLankanPhoneNational("+94768545236"), "768545236")
    assert.equal(toSriLankanPhoneNational("0768545236"), "768545236")
    assert.equal(normalizeSriLankanPhone("768545236"), "+94768545236")
    assert.equal(normalizeSriLankanPhone("+94768545236"), "+94768545236")
    assert.equal(
      sanitizeSriLankanPhoneNationalInput("+94 768-545-236"),
      "768545236"
    )
  })
})

function validCheckoutAddressFormData() {
  const formData = new FormData()
  formData.set("full_name", "Test Customer")
  formData.set("email", "Customer@Example.com")
  formData.set("shipping_address.phone", "+94768545236")
  formData.set("shipping_address.address_1", "123 Main Street")
  formData.set("shipping_address.city", "Colombo")
  formData.set("shipping_address.province", "Western")
  formData.set("shipping_address.postal_code", "00100")
  formData.set("shipping_address.country_code", "lk")
  formData.set("delivery_instructions", "Call on arrival.")
  return formData
}
