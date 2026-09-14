import assert from "node:assert/strict"
import test from "node:test"

import {
  addProductToCompareStorage,
  normalizeCompareIds,
  readStoredCompareIds,
  replaceCompareStorage,
} from "../compare-products"

function installStorage() {
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  })
  return values
}

test("normalizes safe, unique compare IDs within the configured limit", () => {
  assert.deepEqual(
    normalizeCompareIds("prod_a,invalid,prod_a,prod_b", 4),
    ["prod_a", "prod_b"]
  )
})

test("rejects products from a different compare group", () => {
  installStorage()
  const first = addProductToCompareStorage(
    { id: "prod_a", compareGroupKeys: ["note-counters"] },
    { limit: 4 }
  )
  const second = addProductToCompareStorage(
    { id: "prod_b", compareGroupKeys: ["metal-testers"] },
    { limit: 4 }
  )

  assert.equal(first.success, true)
  assert.equal(second.success, false)
  assert.deepEqual(readStoredCompareIds(), ["prod_a"])
})

test("enforces the compare limit without overwriting current selections", () => {
  installStorage()
  for (const id of ["prod_a", "prod_b"]) {
    assert.equal(
      addProductToCompareStorage(
        { id, compareGroupKeys: ["printers"] },
        { limit: 2 }
      ).success,
      true
    )
  }

  const result = addProductToCompareStorage(
    { id: "prod_c", compareGroupKeys: ["printers"] },
    { limit: 2 }
  )
  assert.equal(result.success, false)
  assert.deepEqual(readStoredCompareIds(), ["prod_a", "prod_b"])
})

test("replaces the comparison atomically with a new product", () => {
  const storage = installStorage()
  addProductToCompareStorage({ id: "prod_a", compareGroupKeys: ["boards"] })

  const result = replaceCompareStorage({
    id: "prod_b",
    compareGroupKeys: ["scanners"],
  })

  assert.equal(result.success, true)
  assert.deepEqual(readStoredCompareIds(), ["prod_b"])
  assert.equal(storage.get("cba_compare_product_hints_v1"), '{"prod_b":["scanners"]}')
})
