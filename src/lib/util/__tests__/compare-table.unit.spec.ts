import assert from "node:assert/strict"
import test from "node:test"

import { buildCompareRows } from "../compare-table"

function product(id: string) {
  return {
    id,
    category: { id: "pcat_printers", name: "Printers", handle: "printers" },
    price: { status: "available", calculated_amount: 1000, currency_code: "lkr" },
    inventory: { status: "in_stock" },
  } as any
}

test("builds the union of automatic rows with deterministic order and N/A", () => {
  const rows = buildCompareRows([product("prod_a"), product("prod_b")], [
    {
      productId: "prod_a",
      rows: [
        { id: "auto:weight", label: "Weight", source_type: "specification", value: "8 kg", group_sort_order: 2, sort_order: 1 },
        { id: "auto:speed", label: "Print Speed", source_type: "specification", value: 22, group_sort_order: 1, sort_order: 1 },
      ],
    },
    {
      productId: "prod_b",
      rows: [
        { id: "auto:speed", label: "Print Speed", source_type: "specification", value: 30, group_sort_order: 1, sort_order: 1 },
      ],
    },
  ])

  assert.deepEqual(rows.map((row) => row.id), [
    "native-product-type",
    "auto:speed",
    "auto:weight",
    "native-stock",
    "native-price",
  ])
  assert.equal(rows.find((row) => row.id === "auto:weight")?.values.prod_b, "N/A")
})

test("does not duplicate mandatory native rows from manual configuration", () => {
  const rows = buildCompareRows([product("prod_a")], [{
    productId: "prod_a",
    rows: [
      { id: "manual-price", label: "Special price", source_type: "native_price", value: null },
    ],
  }])
  assert.equal(rows.filter((row) => row.id === "native-price").length, 1)
  assert.equal(rows.some((row) => row.id === "manual-price"), false)
})
