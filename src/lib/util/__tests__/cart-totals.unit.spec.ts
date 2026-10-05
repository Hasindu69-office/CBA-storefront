import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { mapAuthoritativeTotals } from "../cart-totals"

describe("mapAuthoritativeTotals shipping display", () => {
  it("preserves fractional tax and total amounts", () => {
    const mapped = mapAuthoritativeTotals({
      currency_code: "lkr",
      item_subtotal: 10,
      item_tax_total: 0.5,
      tax_total: 0.5,
      total: 10.5,
      shipping_methods: [],
    })

    assert.match(
      mapped.rows.find((row) => row.key === "tax")?.display ?? "",
      /0\.50/
    )
    assert.match(mapped.total.display, /10\.50/)
  })

  it("shows tax-exclusive delivery and one combined tax row", () => {
    const mapped = mapAuthoritativeTotals({
      currency_code: "lkr",
      item_subtotal: 10,
      item_tax_total: 0.5,
      shipping_subtotal: 50,
      shipping_tax_total: 2.5,
      shipping_total: 52.5,
      tax_total: 3,
      total: 63,
      shipping_methods: [{ name: "Delivery" }],
      shipping_address: { address_1: "123 Main St" },
    })

    assert.equal(mapped.rows.find((row) => row.key === "shipping")?.amount, 50)
    assert.equal(mapped.rows.find((row) => row.key === "tax")?.amount, 3)
    assert.equal(mapped.rows.some((row) => row.key === "item-tax"), false)
    assert.equal(mapped.rows.some((row) => row.key === "shipping-tax"), false)
    assert.equal(mapped.total.amount, 63)
  })

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
    assert.equal(mapped.shippingDisplay, "Calculated at checkout")
    assert.equal(mapped.shippingSummaryLabel, "Delivery")
    assert.equal(mapped.totalLabel, "Estimated total")
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
    assert.equal(mapped.shippingLabel, "Delivery Fee")
    assert.equal(mapped.totalLabel, "Total")
    assert.equal(
      mapped.rows.some((row) => row.key === "shipping"),
      true
    )
  })

  it("treats a stale method that is invalid for the current cart as pending", () => {
    const mapped = mapAuthoritativeTotals(
      {
        currency_code: "lkr",
        item_subtotal: 100,
        shipping_total: 0,
        total: 100,
        shipping_methods: [{}],
        shipping_address: { address_1: "123 Main St" },
      },
      {
        fulfillmentMode: "delivery-only",
        shippingSelectionValid: false,
      }
    )

    assert.equal(mapped.shippingIsPending, true)
    assert.equal(mapped.shippingVisible, false)
    assert.equal(mapped.shippingIsFree, false)
    assert.equal(mapped.shippingDisplay, "")
    assert.ok(mapped.states.includes("shipping_required"))
  })

  it("presents zero-priced pickup as self collection, not free delivery", () => {
    const mapped = mapAuthoritativeTotals(
      {
        currency_code: "lkr",
        item_subtotal: 100,
        shipping_total: 0,
        shipping_subtotal: 0,
        total: 100,
        shipping_methods: [{}],
        shipping_address: { address_1: "123 Main St" },
      },
      { fulfillmentMode: "pickup-only" }
    )

    assert.equal(mapped.shippingLabel, "Collection")
    assert.equal(mapped.shippingDisplay, "Self collection")
    assert.equal(mapped.shippingIsSelfCollection, true)
    assert.equal(mapped.shippingIsFree, false)
    assert.equal(
      mapped.rows.find((row) => row.key === "shipping")?.display,
      "Self collection"
    )
  })

  it("retains a configured pickup charge as a collection fee", () => {
    const mapped = mapAuthoritativeTotals(
      {
        currency_code: "lkr",
        item_subtotal: 100,
        shipping_total: 50,
        shipping_subtotal: 50,
        total: 150,
        shipping_methods: [{}],
        shipping_address: { address_1: "123 Main St" },
      },
      { fulfillmentMode: "pickup-only" }
    )

    assert.equal(mapped.shippingLabel, "Collection fee")
    assert.match(mapped.shippingDisplay, /50/)
    assert.equal(mapped.shippingIsSelfCollection, false)
  })

  it("keeps mixed fulfillment charges labelled as delivery", () => {
    const mapped = mapAuthoritativeTotals(
      {
        currency_code: "lkr",
        item_subtotal: 100,
        shipping_total: 50,
        total: 150,
        shipping_methods: [{}, {}],
        shipping_address: { address_1: "123 Main St" },
      },
      { fulfillmentMode: "mixed" }
    )

    assert.equal(mapped.shippingLabel, "Delivery Fee")
    assert.match(mapped.shippingDisplay, /50/)
  })

  it("shows the paid delivery amount when a method is selected", () => {
    const mapped = mapAuthoritativeTotals({
      currency_code: "lkr",
      item_subtotal: 100,
      shipping_total: 500,
      shipping_subtotal: 500,
      total: 600,
      shipping_methods: [{ name: "Domex Standard" }],
      shipping_address: { address_1: "123 Main St" },
    })

    assert.equal(mapped.shippingIsPending, false)
    assert.equal(mapped.shippingVisible, true)
    assert.equal(mapped.shippingIsFree, false)
    assert.notEqual(mapped.shippingDisplay, "Free")
    assert.match(mapped.shippingDisplay, /500/)
    assert.equal(mapped.rows.find((row) => row.key === "shipping")?.amount, 500)
    assert.equal(mapped.shippingSummaryLabel, "Delivery — Domex Standard")
    assert.deepEqual(mapped.selectedShippingMethodNames, ["Domex Standard"])
  })

  it("summarizes multiple selected fulfillment methods", () => {
    const mapped = mapAuthoritativeTotals(
      {
        currency_code: "lkr",
        item_subtotal: 100,
        shipping_total: 50,
        total: 150,
        shipping_methods: [{ name: "Domex" }, { name: "Store pickup" }],
        shipping_address: { address_1: "123 Main St" },
      },
      { fulfillmentMode: "mixed" }
    )

    assert.equal(mapped.shippingSummaryLabel, "Delivery (2 methods)")
    assert.deepEqual(mapped.selectedShippingMethodNames, ["Domex", "Store pickup"])
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
