import assert from "node:assert/strict"
import test from "node:test"

import { routeHostedAuthDestination, safeAuthDestination } from "../auth-modal"

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

test("routeHostedAuthDestination preserves a safe deep account URL", () => {
  assert.equal(
    routeHostedAuthDestination(
      "/account/orders/details/order_123",
      "source=email",
      "#product-reviews"
    ),
    "/account/orders/details/order_123?source=email#product-reviews"
  )
})

test("routeHostedAuthDestination returns auth utility routes to the account", () => {
  assert.equal(routeHostedAuthDestination("/account/reset-password", "token=secret"), "/account")
  assert.equal(routeHostedAuthDestination("/account/email-change/confirm", "token=secret"), "/account")
})
