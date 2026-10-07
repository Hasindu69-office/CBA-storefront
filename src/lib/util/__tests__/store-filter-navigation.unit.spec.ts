import assert from "node:assert/strict"
import test from "node:test"

import {
  buildStoreBrandQueryHref,
  buildStoreCategoryFilterHref,
  buildStoreCategoryQueryHref,
  buildStoreFilterResetHref,
  isValidStoreFilterToken,
} from "../store-filter-navigation"

test("removing the only route category exits to the store", () => {
  const href = buildStoreCategoryFilterHref({
    pathname: "/categories/scanner",
    searchParams: new URLSearchParams(),
    nextCategories: [],
    routeCategoryId: "pcat_scanner",
  })

  assert.equal(href, "/store")
})

test("removing the route category preserves remaining categories on the store", () => {
  const href = buildStoreCategoryFilterHref({
    pathname: "/categories/scanner",
    searchParams: new URLSearchParams(
      "brand=brand_1&min_price=1000&filters=%7B%22stock_status%22%3A%5B%22in_stock%22%5D%7D&page=2"
    ),
    nextCategories: ["pcat_other"],
    routeCategoryId: "pcat_scanner",
  })

  assert.equal(
    href,
    "/store?brand=brand_1&min_price=1000&filters=%7B%22stock_status%22%3A%5B%22in_stock%22%5D%7D&category=pcat_other"
  )
})

test("removing a non-route category keeps the category landing page", () => {
  const href = buildStoreCategoryFilterHref({
    pathname: "/categories/scanner",
    searchParams: new URLSearchParams("category=pcat_scanner,pcat_other&page=3"),
    nextCategories: ["pcat_scanner"],
    routeCategoryId: "pcat_scanner",
  })

  assert.equal(href, "/categories/scanner?category=pcat_scanner")
})

test("category navigation preserves search, sort, sale, and other filters", () => {
  const href = buildStoreCategoryFilterHref({
    pathname: "/categories/scanner",
    searchParams: new URLSearchParams(
      "query=laser&sortBy=price_asc&on_sale=true&brand=brand_1&max_price=50000&page=4"
    ),
    nextCategories: ["pcat_scanner"],
    routeCategoryId: "pcat_scanner",
  })

  assert.equal(
    href,
    "/categories/scanner?query=laser&sortBy=price_asc&on_sale=true&brand=brand_1&max_price=50000&category=pcat_scanner"
  )
})

test("reset exits a category page and clears filter parameters", () => {
  const href = buildStoreFilterResetHref({
    pathname: "/categories/scanner",
    searchParams: new URLSearchParams(
      "query=laser&on_sale=true&category=pcat_scanner&brand=brand_1&min_price=1000&max_price=50000&price_range=100000&filters=%7B%22stock_status%22%3A%5B%22in_stock%22%5D%7D&sortBy=price_asc&page=2"
    ),
    routeCategoryId: "pcat_scanner",
  })

  assert.equal(href, "/store?query=laser&on_sale=true")
})

test("store-page reset stays on the store page", () => {
  const href = buildStoreFilterResetHref({
    pathname: "/store",
    searchParams: new URLSearchParams(
      "category=pcat_scanner&brand=brand_1&query=laser&page=2"
    ),
  })

  assert.equal(href, "/store?query=laser")
})

test("brand query href builds a clean store URL", () => {
  assert.equal(buildStoreBrandQueryHref("brand_1"), "/store?brand=brand_1")
})

test("category query href builds a clean store URL", () => {
  assert.equal(
    buildStoreCategoryQueryHref("pcat_scanner"),
    "/store?category=pcat_scanner"
  )
})

test("single-filter query hrefs reject empty or whitespace tokens", () => {
  assert.equal(buildStoreBrandQueryHref(""), null)
  assert.equal(buildStoreBrandQueryHref("   "), null)
  assert.equal(buildStoreCategoryQueryHref(""), null)
  assert.equal(buildStoreCategoryQueryHref("\t"), null)
})

test("single-filter query hrefs reject oversized tokens", () => {
  const oversized = "x".repeat(256)
  assert.equal(buildStoreBrandQueryHref(oversized), null)
  assert.equal(buildStoreCategoryQueryHref(oversized), null)
  assert.equal(isValidStoreFilterToken(oversized), false)
})

test("single-filter query hrefs encode special characters", () => {
  assert.equal(
    buildStoreBrandQueryHref("brand/1&2"),
    "/store?brand=brand%2F1%262"
  )
  assert.equal(
    buildStoreCategoryQueryHref("pcat a+b"),
    "/store?category=pcat%20a%2Bb"
  )
})

test("isValidStoreFilterToken accepts trimmed valid ids", () => {
  assert.equal(isValidStoreFilterToken("brand_1"), true)
  assert.equal(isValidStoreFilterToken("  pcat_scanner  "), true)
  assert.equal(isValidStoreFilterToken(null), false)
  assert.equal(isValidStoreFilterToken(undefined), false)
})
