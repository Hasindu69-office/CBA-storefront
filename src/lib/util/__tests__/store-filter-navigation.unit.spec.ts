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
    routeCategoryHandle: "scanner",
  })

  assert.equal(href, "/store")
})

test("removing the route category preserves remaining categories on the store", () => {
  const href = buildStoreCategoryFilterHref({
    pathname: "/categories/scanner",
    searchParams: new URLSearchParams(
      "brand=cba&min_price=1000&filters=%7B%22stock_status%22%3A%5B%22in_stock%22%5D%7D&page=2"
    ),
    nextCategories: ["other"],
    routeCategoryHandle: "scanner",
  })

  assert.equal(
    href,
    "/store?brand=cba&min_price=1000&filters=%7B%22stock_status%22%3A%5B%22in_stock%22%5D%7D&category=other"
  )
})

test("removing a non-route category keeps the category landing page", () => {
  const href = buildStoreCategoryFilterHref({
    pathname: "/categories/scanner",
    searchParams: new URLSearchParams("category=scanner,other&page=3"),
    nextCategories: ["scanner"],
    routeCategoryHandle: "scanner",
  })

  assert.equal(href, "/categories/scanner?category=scanner")
})

test("category navigation preserves search, sort, sale, and other filters", () => {
  const href = buildStoreCategoryFilterHref({
    pathname: "/categories/scanner",
    searchParams: new URLSearchParams(
      "query=laser&sortBy=price_asc&on_sale=true&brand=cba&max_price=50000&page=4"
    ),
    nextCategories: ["scanner"],
    routeCategoryHandle: "scanner",
  })

  assert.equal(
    href,
    "/categories/scanner?query=laser&sortBy=price_asc&on_sale=true&brand=cba&max_price=50000&category=scanner"
  )
})

test("reset exits a category page and clears filter parameters", () => {
  const href = buildStoreFilterResetHref({
    pathname: "/categories/scanner",
    searchParams: new URLSearchParams(
      "query=laser&on_sale=true&category=scanner&brand=cba&min_price=1000&max_price=50000&price_range=100000&filters=%7B%22stock_status%22%3A%5B%22in_stock%22%5D%7D&sortBy=price_asc&page=2"
    ),
    routeCategoryHandle: "scanner",
  })

  assert.equal(href, "/store?query=laser&on_sale=true")
})

test("store-page reset stays on the store page", () => {
  const href = buildStoreFilterResetHref({
    pathname: "/store",
    searchParams: new URLSearchParams(
      "category=scanner&brand=cba&query=laser&page=2"
    ),
  })

  assert.equal(href, "/store?query=laser")
})

test("brand query href builds a clean store URL from slug", () => {
  assert.equal(buildStoreBrandQueryHref("cba"), "/store?brand=cba")
})

test("category query href builds a clean store URL from handle", () => {
  assert.equal(
    buildStoreCategoryQueryHref("scanner"),
    "/store?category=scanner"
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

test("isValidStoreFilterToken accepts trimmed valid tokens", () => {
  assert.equal(isValidStoreFilterToken("cba"), true)
  assert.equal(isValidStoreFilterToken("  scanner  "), true)
  assert.equal(isValidStoreFilterToken(null), false)
  assert.equal(isValidStoreFilterToken(undefined), false)
})
