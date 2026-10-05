import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type { HttpTypes } from "@medusajs/types"
import {
  buildFulfillmentPlan,
  deriveFulfillmentModeFromItems,
  deriveFulfillmentModeFromMethodNames,
  hasCompletePickupAddress,
} from "../fulfillment-plan"

describe("buildFulfillmentPlan", () => {
  it("builds a delivery-only plan using Domex and explicit test options", () => {
    const plan = buildFulfillmentPlan(
      cart([line("item_delivery", "sp_delivery", "default")]),
      [deliveryOption(), testDeliveryOption(), pickupOption()]
    )

    assert.equal(plan.mode, "delivery-only")
    assert.deepEqual(
      plan.groups[0].eligibleOptions.map((option) => option.id),
      ["so_domex", "so_test"]
    )
    assert.equal(plan.isComplete, false)
  })

  it("builds a pickup-only plan and identifies its products", () => {
    const plan = buildFulfillmentPlan(
      cart([line("item_pickup", "sp_pickup", "pickup-only")], ["so_pickup"]),
      [deliveryOption(), pickupOption()]
    )

    assert.equal(plan.mode, "pickup-only")
    assert.equal(plan.groups[0].kind, "pickup")
    assert.equal(plan.groups[0].items[0].product_title, "Product item_pickup")
    assert.equal(plan.isComplete, true)
  })

  it("requires both selected methods for a mixed cart", () => {
    const items = [
      line("item_delivery", "sp_delivery", "default"),
      line("item_pickup", "sp_pickup", "pickup-only"),
    ]
    const options = [deliveryOption(), pickupOption()]

    assert.equal(
      buildFulfillmentPlan(cart(items, ["so_pickup"]), options).isComplete,
      false
    )
    const complete = buildFulfillmentPlan(
      cart(items, ["so_domex", "so_pickup"]),
      options
    )
    assert.equal(complete.mode, "mixed")
    assert.equal(complete.isComplete, true)
    assert.deepEqual(complete.selectedOptionIds.sort(), [
      "so_domex",
      "so_pickup",
    ])
  })

  it("fails closed for an incomplete pickup address", () => {
    const option = pickupOption() as any
    option.service_zone.fulfillment_set.location.address.postal_code = null
    const plan = buildFulfillmentPlan(
      cart([line("item_pickup", "sp_pickup", "pickup-only")], ["so_pickup"]),
      [option]
    )

    assert.equal(plan.isComplete, false)
    assert.equal(plan.groups[0].eligibleOptions.length, 0)
    assert.match(
      plan.groups[0].configurationError ?? "",
      /address is incomplete/i
    )
  })

  it("fails closed when inventory becomes insufficient", () => {
    const option = { ...deliveryOption(), insufficient_inventory: true } as any
    const plan = buildFulfillmentPlan(
      cart([line("item_delivery", "sp_delivery", "default")], ["so_domex"]),
      [option]
    )

    assert.equal(plan.isComplete, false)
    assert.match(plan.groups[0].configurationError ?? "", /inventory/i)
  })
})

describe("fulfillment mode presentation", () => {
  it("uses shipping profiles as the authoritative cart classification", () => {
    assert.equal(
      deriveFulfillmentModeFromItems([
        line("item_delivery", "sp_delivery", "default"),
        line("item_pickup", "sp_pickup", "pickup-only"),
      ]),
      "mixed"
    )
    assert.equal(
      deriveFulfillmentModeFromItems([
        line("item_pickup", "sp_pickup", "pickup-only"),
      ]),
      "pickup-only"
    )
  })

  it("recognizes self collection from an order shipping-method projection", () => {
    assert.equal(
      deriveFulfillmentModeFromMethodNames([
        { name: "Store Pickup – CBA Main Warehouse" },
      ]),
      "pickup-only"
    )
    assert.equal(
      deriveFulfillmentModeFromMethodNames([
        { name: "Store Pickup – CBA Main Warehouse" },
        { name: "CBA Domex Standard Delivery" },
      ]),
      "mixed"
    )
  })
})

describe("hasCompletePickupAddress", () => {
  it("requires all operational address fields", () => {
    assert.equal(hasCompletePickupAddress(address()), true)
    assert.equal(
      hasCompletePickupAddress({ ...address(), province: "" }),
      false
    )
  })
})

function cart(items: any[], selectedOptionIds: string[] = []) {
  return {
    items,
    shipping_methods: selectedOptionIds.map((shipping_option_id, index) => ({
      id: `sm_${index}`,
      shipping_option_id,
    })),
  } as unknown as Pick<HttpTypes.StoreCart, "items" | "shipping_methods">
}

function line(id: string, profileId: string, profileType: string) {
  return {
    id,
    title: `Product ${id}`,
    product_title: `Product ${id}`,
    quantity: 1,
    requires_shipping: true,
    variant: {
      product: {
        shipping_profile: { id: profileId, type: profileType },
      },
    },
  }
}

function deliveryOption() {
  return {
    id: "so_domex",
    name: "Domex Delivery",
    shipping_profile_id: "sp_delivery",
    provider_id: "cba-domex_standard",
    price_type: "flat",
    amount: 400,
    insufficient_inventory: false,
    service_zone: { fulfillment_set: { type: "shipping" } },
  } as unknown as HttpTypes.StoreCartShippingOption
}

function testDeliveryOption() {
  return {
    ...deliveryOption(),
    id: "so_test",
    provider_id: "manual_manual",
    data: { cba_test_fixture: true },
  } as unknown as HttpTypes.StoreCartShippingOption
}

function pickupOption() {
  return {
    id: "so_pickup",
    name: "CBA Main Warehouse",
    shipping_profile_id: "sp_pickup",
    provider_id: "manual_manual",
    price_type: "flat",
    amount: 0,
    insufficient_inventory: false,
    service_zone: {
      fulfillment_set: {
        type: "pickup",
        location: {
          id: "sloc_1",
          name: "CBA Main Warehouse",
          address: address(),
        },
      },
    },
  } as unknown as HttpTypes.StoreCartShippingOption
}

function address() {
  return {
    address_1: "1 Main Street",
    city: "Colombo",
    province: "Western",
    postal_code: "00100",
    country_code: "lk",
  }
}
