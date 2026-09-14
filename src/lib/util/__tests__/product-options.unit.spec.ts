import assert from "node:assert/strict"
import test from "node:test"
import { hasPurchasablePrice, variantOptionsMap, visibleProductOptions, visibleVariantTitle } from "../product-options"

test("technical labels disappear but colors remain, including a single color", () => {
  for (const label of [undefined, "", "Default", " default variant ", "N/A"]) assert.equal(visibleVariantTitle(label), null)
  assert.equal(visibleVariantTitle("Black"), "Black")
  const options: any = [{ title: "Default", values: [{ value: "Default" }] }, { title: "Color", values: [{ value: "Black" }] }]
  assert.deepEqual(visibleProductOptions(options), [options[1]])
  assert.equal(visibleProductOptions([{ title: "Default", values: [{ value: "Red" }] }] as any).length, 1)
})

test("optionless variants have a stable empty selection map", () => {
  assert.deepEqual(variantOptionsMap(undefined), {})
  assert.deepEqual(variantOptionsMap([]), {})
  assert.deepEqual(variantOptionsMap([{ option_id: "color", value: "Red" }] as any), { color: "Red" })
})

test("missing and invalid prices are unpurchasable; zero is a valid configured price", () => {
  assert.equal(hasPurchasablePrice(undefined), false)
  for (const amount of [undefined, null, NaN, Infinity, -1]) {
    assert.equal(hasPurchasablePrice({ calculated_price: { calculated_amount: amount, currency_code: "lkr" } } as any), false)
  }
  for (const amount of [0, 100]) assert.equal(hasPurchasablePrice({ calculated_price: { calculated_amount: amount, currency_code: "lkr" } } as any), true)
})
