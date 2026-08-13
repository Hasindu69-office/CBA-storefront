import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { mapAuthoritativeTotals } from "../cart-totals"

describe("mapAuthoritativeTotals shipping display", () => {
  it("treats missing shipping method as pending, not free", () => {
    const mapped = mapAuthoritativeTotals({
      currency_code: "lkr",
      item_subtotal: 100,
      shipping_total: 0,
      shipping_subtotal: 0,
      total: 100,
      shipping_methods: [],
      shipping_address: { address_1: "123 Main St" },
    })

    assert.equal(mapped.shippingIsPending, true)
    assert.equal(mapped.shippingVisible, false)
    assert.equal(mapped.shippingIsFree, false)
    assert.notEqual(mapped.shippingDisplay, "Free")
    assert.equal(mapped.shippingDisplay, "")
    assert.equal(
      mapped.rows.some((row) => row.key === "shipping"),
      false
    )
    assert.ok(mapped.states.includes("shipping_required"))
  })

  it("shows Free only when a shipping method is selected and fee is zero", () => {
    const mapped = mapAuthoritativeTotals({
      currency_code: "lkr",
      item_subtotal: 100,
      shipping_total: 0,
      shipping_subtotal: 0,
      total: 100,
      shipping_methods: [{}],
      shipping_address: { address_1: "123 Main St" },
    })

    assert.equal(mapped.shippingIsPending, false)
    assert.equal(mapped.shippingVisible, true)
    assert.equal(mapped.shippingIsFree, true)
    assert.equal(mapped.shippingDisplay, "Free")
    assert.equal(
      mapped.rows.some((row) => row.key === "shipping"),
      true
    )
  })

  it("shows the paid delivery amount when a method is selected", () => {
    const mapped = mapAuthoritativeTotals({
      currency_code: "lkr",
      item_subtotal: 100,
      shipping_total: 500,
      shipping_subtotal: 500,
      total: 600,
      shipping_methods: [{}],
      shipping_address: { address_1: "123 Main St" },
    })

    assert.equal(mapped.shippingIsPending, false)
    assert.equal(mapped.shippingVisible, true)
    assert.equal(mapped.shippingIsFree, false)
    assert.notEqual(mapped.shippingDisplay, "Free")
    assert.match(mapped.shippingDisplay, /500/)
    assert.equal(
      mapped.rows.find((row) => row.key === "shipping")?.amount,
      500
    )
  })

  it("keeps strike-through free shipping when a method is selected with discount", () => {
    const mapped = mapAuthoritativeTotals({
      currency_code: "lkr",
      item_subtotal: 25000,
      shipping_total: 0,
      shipping_subtotal: 500,
      original_shipping_subtotal: 500,
      shipping_discount_total: 500,
      total: 25000,
      shipping_methods: [{}],
      shipping_address: { address_1: "123 Main St" },
    })

    assert.equal(mapped.shippingIsPending, false)
    assert.equal(mapped.shippingVisible, true)
    assert.equal(mapped.shippingIsFree, true)
    assert.equal(mapped.shippingDisplay, "Free")
    assert.match(mapped.shippingBeforeDiscountDisplay ?? "", /500/)
  })

  it("does not expose strike-through amounts while shipping is pending", () => {
    const mapped = mapAuthoritativeTotals({
      currency_code: "lkr",
      item_subtotal: 100,
      shipping_total: 0,
      shipping_subtotal: 500,
      shipping_discount_total: 500,
      total: 100,
      shipping_methods: [],
    })

    assert.equal(mapped.shippingIsPending, true)
    assert.equal(mapped.shippingBeforeDiscountDisplay, null)
    assert.equal(mapped.shippingIsFree, false)
  })
})
