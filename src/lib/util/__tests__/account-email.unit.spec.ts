import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { emailChangeErrorMessage, validateEmailChange } from "../account-email"

describe("account email change helpers", () => {
  it("accepts a normalized new email and rejects invalid client input", () => {
    assert.deepEqual(validateEmailChange({
      current_email: "old@example.com",
      new_email: " New@Example.com ",
      confirm_email: "new@example.com",
      current_password: "CurrentPassword1",
    }), {})

    const errors = validateEmailChange({
      current_email: "same@example.com",
      new_email: "same@example.com",
      confirm_email: "different@example.com",
      current_password: "",
    })
    assert.ok(errors.new_email)
    assert.ok(errors.confirm_email)
    assert.ok(errors.current_password)
  })

  it("maps stable server errors without leaking internals", () => {
    assert.equal(emailChangeErrorMessage("CURRENT_PASSWORD_INVALID"), "Your current password is incorrect.")
    assert.equal(emailChangeErrorMessage("EMAIL_ALREADY_IN_USE"), "That email address is already in use.")
    assert.match(emailChangeErrorMessage("UNKNOWN"), /could not complete/)
  })
})
