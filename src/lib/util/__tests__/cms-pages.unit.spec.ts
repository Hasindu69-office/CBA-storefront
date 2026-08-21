import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { isValidCmsSlug, safeCmsPath, safeCmsUrl } from "../cms-pages"

describe("CMS page utility validation", () => {
  it("accepts lowercase URL-safe CMS slugs", () => {
    assert.equal(isValidCmsSlug("about-us"), true)
    assert.equal(isValidCmsSlug("privacy-policy-2026"), true)
  })

  it("rejects unsafe or malformed CMS slugs", () => {
    assert.equal(isValidCmsSlug("About-Us"), false)
    assert.equal(isValidCmsSlug("about_us"), false)
    assert.equal(isValidCmsSlug("about--us"), false)
    assert.equal(isValidCmsSlug("../about-us"), false)
    assert.equal(isValidCmsSlug("a".repeat(181)), false)
  })

  it("accepts only safe internal CMS paths", () => {
    assert.equal(safeCmsPath("/about-us"), "/about-us")
    assert.equal(safeCmsPath("//example.com/about-us"), "")
    assert.equal(safeCmsPath("/about\\us"), "")
    assert.equal(safeCmsPath("about-us"), "")
  })

  it("accepts safe http links and rejects executable protocols", () => {
    assert.equal(safeCmsUrl("/contact"), "/contact")
    assert.equal(safeCmsUrl("https://example.com/help"), "https://example.com/help")
    assert.equal(safeCmsUrl("javascript:alert(1)"), "")
    assert.equal(safeCmsUrl("data:text/html,hello"), "")
  })
})
