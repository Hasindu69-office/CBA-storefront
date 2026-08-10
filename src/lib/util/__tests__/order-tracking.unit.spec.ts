import {
  formatOrderNumber,
  formatStatusLabel,
  isSafeExternalUrl,
  validateGuestLookupClient,
  validateOtpClient,
} from "../../../modules/order-tracking/utils/format-tracking"
import assert from "node:assert/strict"
import test from "node:test"

test("formats order number and status labels", () => {
  assert.equal(formatOrderNumber(1001), "CBA-1001")
  assert.equal(formatStatusLabel("ready_for_dispatch"), "Ready For Dispatch")
})

test("validates external tracking URLs", () => {
  assert.equal(isSafeExternalUrl("https://carrier.example/t"), true)
  assert.equal(isSafeExternalUrl("javascript:alert(1)"), false)
})

test("validates guest lookup and OTP client-side", () => {
  const bad = validateGuestLookupClient({
    order_reference: "",
    email: "",
    phone: "",
  })
  assert.equal(bad.ok, false)

  const ok = validateGuestLookupClient({
    order_reference: "CBA-1001",
    email: "customer@example.com",
    phone: "",
  })
  assert.equal(ok.ok, true)

  assert.equal(validateOtpClient("123").ok, false)
  assert.equal(validateOtpClient("123456").ok, true)
})
