import assert from "node:assert/strict"
import test from "node:test"
import {
  buildMetaEcommerceParams,
  buildSingleProductParams,
  linesFromCartLikeItems,
} from "../build"
import { claimPurchaseEvent, clearPurchaseClaim } from "../dedupe"
import { validateMetaEcommerceParams } from "../validate"

test("validate rejects unsupported events and missing ecommerce content", () => {
  assert.equal(validateMetaEcommerceParams("CustomEvent" as never, {}).ok, false)
  assert.equal(validateMetaEcommerceParams("ViewContent", {}).ok, false)
  assert.equal(validateMetaEcommerceParams("AddToCart", { content_ids: [] }).ok, false)
  assert.equal(
    validateMetaEcommerceParams("Purchase", {
      content_ids: ["prod_1"],
      value: 10,
      currency: "LKR",
    }).ok,
    false
  )
})

test("validate accepts PageView and sanitizes ecommerce payloads", () => {
  assert.deepEqual(validateMetaEcommerceParams("PageView", null), {
    ok: true,
    params: {},
  })

  const result = validateMetaEcommerceParams(
    "ViewContent",
    {
      content_ids: ["  prod_1  ", "prod_1", "", "x".repeat(200)],
      content_type: "product",
      content_name: "  Widget  ",
      currency: "lkr",
      value: 12.345,
      num_items: 2,
      contents: [
        { id: "prod_1", quantity: 2, item_price: 6.172 },
        { id: "", quantity: 1 },
      ],
      ...({ email: "user@example.com" } as Record<string, unknown>),
    } as never,
    {}
  )

  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.deepEqual(result.params, {
    content_ids: ["prod_1"],
    content_type: "product",
    content_name: "Widget",
    currency: "LKR",
    value: 12.35,
    num_items: 2,
    contents: [{ id: "prod_1", quantity: 2, item_price: 6.17 }],
  })
  assert.equal("email" in result.params, false)
})

test("validate requires purchase value, currency, and eventID", () => {
  const ok = validateMetaEcommerceParams(
    "Purchase",
    {
      content_ids: ["prod_1"],
      value: 100,
      currency: "LKR",
    },
    { eventID: "order_1" }
  )
  assert.equal(ok.ok, true)
  if (ok.ok) assert.equal(ok.eventID, "order_1")

  assert.equal(
    validateMetaEcommerceParams(
      "Purchase",
      { content_ids: ["prod_1"], value: Number.NaN, currency: "LKR" },
      { eventID: "order_1" }
    ).ok,
    false
  )
})

test("build maps lines to Meta content_ids and totals", () => {
  const params = buildMetaEcommerceParams({
    lines: [
      { productId: "p1", quantity: 2, itemPrice: 10, title: "A" },
      { productId: "p1", quantity: 1, itemPrice: 10 },
      { productId: "p2", quantity: 1, itemPrice: 5, title: "B" },
      { productId: " ", quantity: 1 },
    ],
    currency: "lkr",
    value: 35,
  })

  assert.deepEqual(params.content_ids, ["p1", "p2"])
  assert.equal(params.num_items, 4)
  assert.equal(params.value, 35)
  assert.equal(params.currency, "LKR")
  assert.equal(params.content_type, "product")
  assert.deepEqual(params.contents, [
    { id: "p1", quantity: 3, item_price: 10 },
    { id: "p2", quantity: 1, item_price: 5 },
  ])
})

test("buildSingleProductParams sets content name and value", () => {
  const params = buildSingleProductParams({
    productId: "prod_9",
    quantity: 3,
    currency: "LKR",
    contentName: "Cable",
    itemPrice: 25,
  })
  assert.deepEqual(params.content_ids, ["prod_9"])
  assert.equal(params.value, 25)
  assert.equal(params.num_items, 3)
  assert.equal(params.content_name, "Cable")
})

test("linesFromCartLikeItems maps product ids and unit prices", () => {
  assert.deepEqual(
    linesFromCartLikeItems([
      {
        product_id: "p1",
        quantity: 2,
        unit_price: 10,
        product_title: "A",
      },
      { product_id: null, quantity: 1, unit_price: 5 },
      { product_id: "p2", quantity: 1, total: 8 },
    ]),
    [
      { productId: "p1", quantity: 2, itemPrice: 10, title: "A" },
      { productId: "p2", quantity: 1, itemPrice: 8, title: undefined },
    ]
  )
})

test("claimPurchaseEvent dedupes within a session", () => {
  const store = new Map<string, string>()
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  } as Storage

  const previousWindow = (globalThis as { window?: unknown }).window
  ;(globalThis as { window?: unknown }).window = {
    sessionStorage: storage,
  }

  try {
    clearPurchaseClaim("order_abc")
    assert.equal(claimPurchaseEvent("order_abc"), true)
    assert.equal(claimPurchaseEvent("order_abc"), false)
    assert.equal(claimPurchaseEvent("order_xyz"), true)
    assert.equal(claimPurchaseEvent(""), false)
  } finally {
    if (previousWindow === undefined) {
      delete (globalThis as { window?: unknown }).window
    } else {
      ;(globalThis as { window?: unknown }).window = previousWindow
    }
  }
})
