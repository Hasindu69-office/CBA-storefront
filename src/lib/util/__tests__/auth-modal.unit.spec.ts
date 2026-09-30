import assert from "node:assert/strict"
import test from "node:test"

import { safeAuthDestination } from "../auth-modal"

test("safeAuthDestination accepts local storefront paths", () => {
  assert.equal(safeAuthDestination("/account/orders?from=cart#latest"), "/account/orders?from=cart#latest")
  assert.equal(safeAuthDestination("/products/printer"), "/products/printer")
})

test("safeAuthDestination rejects external and malformed destinations", () => {
  assert.equal(safeAuthDestination("https://evil.example/account"), null)
  assert.equal(safeAuthDestination("//evil.example/account"), null)
  assert.equal(safeAuthDestination("/\\evil.example"), null)
  assert.equal(safeAuthDestination("account"), null)
  assert.equal(safeAuthDestination("/account\nredirect"), null)
})
