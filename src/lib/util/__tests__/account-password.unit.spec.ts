import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  passwordChangeErrorMessage,
  socialProviderNames,
  validatePasswordChange,
} from "../account-password"

describe("account password helpers", () => {
  it("accepts a valid password change", () => {
    assert.deepEqual(
      validatePasswordChange({
        current_password: "OldPassword1",
        new_password: "NewPassword2",
        confirm_password: "NewPassword2",
      }),
      {}
    )
  })

  it("returns field errors for weak, reused, and mismatched passwords", () => {
    const weak = validatePasswordChange({
      current_password: "",
      new_password: "short",
      confirm_password: "different",
    })
    assert.ok(weak.current_password)
    assert.ok(weak.new_password)
    assert.ok(weak.confirm_password)

    const reused = validatePasswordChange({
      current_password: "SamePassword1",
      new_password: "SamePassword1",
      confirm_password: "SamePassword1",
    })
    assert.match(reused.new_password ?? "", /different/)
  })

  it("maps safe API errors and social-provider labels", () => {
    assert.equal(
      passwordChangeErrorMessage("CURRENT_PASSWORD_INVALID"),
      "Your current password is incorrect."
    )
    assert.deepEqual(socialProviderNames(["google", "facebook"]), ["Google", "Facebook"])
  })
})
