import assert from "node:assert/strict"
import test from "node:test"
import { GTM_ID_FALLBACK, getGtmId, isValidGtmId } from "../config"
import {
  pushDataLayer,
  pushVirtualPageView,
  sanitizeDataLayerPayload,
} from "../data-layer"

test("isValidGtmId accepts official container IDs", () => {
  assert.equal(isValidGtmId("GTM-WPLSJRPK"), true)
  assert.equal(isValidGtmId("GTM-ABC123"), true)
  assert.equal(isValidGtmId("  GTM-WPLSJRPK  "), true)
})

test("isValidGtmId rejects malformed or injectable values", () => {
  assert.equal(isValidGtmId(""), false)
  assert.equal(isValidGtmId(null), false)
  assert.equal(isValidGtmId(undefined), false)
  assert.equal(isValidGtmId("gtm-wplsjrpk"), false)
  assert.equal(isValidGtmId("GTM-"), false)
  assert.equal(isValidGtmId("GTM-abc"), false)
  assert.equal(isValidGtmId("GTM-WPLSJRPK';alert(1)"), false)
  assert.equal(isValidGtmId("UA-12345-1"), false)
  assert.equal(isValidGtmId("https://evil.example/x"), false)
})

test("getGtmId falls back when env missing or invalid", () => {
  const previous = process.env.NEXT_PUBLIC_GTM_ID
  try {
    delete process.env.NEXT_PUBLIC_GTM_ID
    assert.equal(getGtmId(), GTM_ID_FALLBACK)

    process.env.NEXT_PUBLIC_GTM_ID = "not-a-gtm-id"
    assert.equal(getGtmId(), GTM_ID_FALLBACK)

    process.env.NEXT_PUBLIC_GTM_ID = "GTM-TEST99"
    assert.equal(getGtmId(), "GTM-TEST99")
  } finally {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_GTM_ID
    } else {
      process.env.NEXT_PUBLIC_GTM_ID = previous
    }
  }
})

test("sanitizeDataLayerPayload keeps scalars and drops unsafe values", () => {
  assert.equal(sanitizeDataLayerPayload(null), null)
  assert.equal(sanitizeDataLayerPayload([] as never), null)

  const result = sanitizeDataLayerPayload({
    event: "virtualPageView",
    page_path: "  /lk/products  ",
    value: 12.5,
    active: true,
    empty: "",
    nested: { a: 1 },
    list: [1, 2],
    fn: () => 1,
    "bad key": "x",
    "1startsWithNumber": "no",
    huge: "x".repeat(600),
  })

  assert.deepEqual(result, {
    event: "virtualPageView",
    page_path: "/lk/products",
    value: 12.5,
    active: true,
    huge: "x".repeat(500),
  })
})

test("pushDataLayer no-ops safely without window", () => {
  assert.equal(typeof window, "undefined")
  assert.equal(pushDataLayer({ event: "test_event" }), false)
  assert.equal(pushVirtualPageView("/lk"), false)
  assert.equal(pushVirtualPageView(""), false)
})
