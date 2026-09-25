import assert from "node:assert/strict"
import test from "node:test"
import { isPopupLocallySuppressed, isPopupProtectedPath, normalizePopupPath, popupDevice, triggerSatisfied } from "../popups"

test("popup protected paths are country-aware", () => {
  assert.equal(normalizePopupPath("/"), "/")
  assert.equal(normalizePopupPath("/lk"), "/")
  assert.equal(normalizePopupPath("/lk/"), "/")
  assert.equal(normalizePopupPath("/lk/store"), "/store")
  assert.equal(normalizePopupPath("/lk/checkout/payment-result?token=x"), "/checkout/payment-result")
  assert.equal(isPopupProtectedPath("/lk/order/order_1/confirmed"), true)
  assert.equal(isPopupProtectedPath("/lk/products/printer"), false)
})
test("popup device breakpoints are deterministic", () => { assert.equal(popupDevice(767), "mobile"); assert.equal(popupDevice(768), "tablet"); assert.equal(popupDevice(1024), "desktop") })
test("ANY and ALL trigger strategies resolve correctly", () => {
  const base = { delay_seconds: 10, scroll_percentage: 30, exit_intent: false }
  assert.equal(triggerSatisfied({ ...base, strategy: "ANY" }, { delay: true, scroll: false, exit: false }), true)
  assert.equal(triggerSatisfied({ ...base, strategy: "ALL" }, { delay: true, scroll: false, exit: false }), false)
  assert.equal(triggerSatisfied({ ...base, strategy: "ALL" }, { delay: true, scroll: true, exit: false }), true)
})
test("local cooldown fallback honors dismiss and newsletter suppression", () => {
  const campaign = { frequency: { once_per_session: false, dismiss_cooldown_hours: 24, suppress_after_newsletter_submit: true } } as any
  assert.equal(isPopupLocallySuppressed(campaign, { dismissed_at: 1_000 }, 2_000), true)
  assert.equal(isPopupLocallySuppressed(campaign, { newsletter_submitted: true }, 2_000), true)
  assert.equal(isPopupLocallySuppressed(campaign, { dismissed_at: 1_000 }, 1_000 + 25 * 3600000), false)
})
