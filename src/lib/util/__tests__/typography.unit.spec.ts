import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  customFontFaceCss,
  defaultTypography,
  normalizeStorefrontTypography,
  normalizeTypographyLocale,
  safeGoogleStylesheet,
  typographyCssVariables,
} from "../typography"

describe("storefront typography safety", () => {
  it("normalizes locale cookies and provides script-aware local defaults", () => {
    assert.equal(normalizeTypographyLocale("si-LK"), "si")
    assert.equal(normalizeTypographyLocale("ta_LK"), "ta")
    assert.equal(normalizeTypographyLocale("unknown"), "en")
    assert.match(typographyCssVariables(defaultTypography("si"))["--font-body"], /Noto Sans Sinhala Variable/)
    assert.match(typographyCssVariables(defaultTypography("ta"))["--font-heading"], /Noto Sans Tamil Variable/)
    assert.equal(
      typographyCssVariables(defaultTypography("en"))["--font-hero-heading"],
      typographyCssVariables(defaultTypography("en"))["--font-heading"]
    )
  })

  it("accepts only the Google CSS2 stylesheet origin", () => {
    assert.ok(safeGoogleStylesheet("https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"))
    assert.equal(safeGoogleStylesheet("https://evil.example/css2?family=Inter"), null)
    assert.equal(safeGoogleStylesheet("javascript:alert(1)"), null)
  })

  it("sanitizes custom font faces and uses only the same-origin asset proxy", () => {
    const typography = normalizeStorefrontTypography({
      locale: "en",
      revision: "one",
      heading: { source: "custom", family_id: "cmsfont_safe", family: "CBAFont_cmsfont_safe", display_name: "Safe", category: "sans-serif" },
      body: { source: "google", family: "Inter", display_name: "Inter", category: "sans-serif" },
      google_stylesheet_url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
      custom_faces: [{ family: "CBAFont_cmsfont_safe", asset_id: "a".repeat(32), format: "woff2", style: "normal", weight_min: 400, weight_max: 700 }],
    }, "en")
    const css = customFontFaceCss(typography)
    assert.match(css, /\/api\/cba\/typography\/fonts\/[a-f0-9]{32}/)
    assert.doesNotMatch(css, /https?:\/\//)
    assert.match(css, /font-weight:400 700/)
  })

  it("emits OpenType faces with the correct CSS format hint", () => {
    const typography = normalizeStorefrontTypography({
      locale: "en",
      heading: { source: "custom", family_id: "cmsfont_otf", family: "CBAFont_cmsfont_otf" },
      body: { source: "custom", family_id: "cmsfont_otf", family: "CBAFont_cmsfont_otf" },
      custom_faces: [{ family: "CBAFont_cmsfont_otf", asset_id: "b".repeat(32), format: "otf", style: "normal", weight_min: 400, weight_max: 400 }],
    }, "en")
    assert.match(customFontFaceCss(typography), /format\("opentype"\)/)
  })

  it("emits TrueType faces with the correct CSS format hint", () => {
    const typography = normalizeStorefrontTypography({
      locale: "en",
      heading: { source: "custom", family_id: "cmsfont_ttf", family: "CBAFont_cmsfont_ttf" },
      body: { source: "custom", family_id: "cmsfont_ttf", family: "CBAFont_cmsfont_ttf" },
      custom_faces: [{ family: "CBAFont_cmsfont_ttf", asset_id: "c".repeat(32), format: "ttf", style: "normal", weight_min: 100, weight_max: 900 }],
    }, "en")
    assert.match(customFontFaceCss(typography), /format\("truetype"\)/)
  })

  it("falls back entirely when a selected custom family has no safe active faces", () => {
    const typography = normalizeStorefrontTypography({
      locale: "en",
      heading: { source: "custom", family_id: "cmsfont_missing", family: "CBAFont_cmsfont_missing" },
      body: { source: "google", family: "Inter" },
      custom_faces: [],
    }, "en")
    assert.equal(typography.revision, "local-default")
    assert.equal(typography.heading.family, "Inter")
  })

  it("resolves hero-only overrides while keeping global typography unchanged", () => {
    const typography = normalizeStorefrontTypography({
      locale: "en",
      heading: { source: "google", family: "Inter" },
      body: { source: "google", family: "Inter" },
      contexts: { homepage_hero: {
        heading: { source: "custom", family_id: "cmsfont_hero", family: "CBAFont_cmsfont_hero" },
        body: { source: "google", family: "Roboto" },
      } },
      custom_faces: [{ family: "CBAFont_cmsfont_hero", asset_id: "d".repeat(32), format: "ttf", style: "normal", weight_min: 400, weight_max: 700 }],
    }, "en")
    assert.equal(typography.heading.family, "Inter")
    assert.equal(typography.contexts.homepage_hero.heading.family, "CBAFont_cmsfont_hero")
    assert.match(typographyCssVariables(typography)["--font-hero-heading"], /CBAFont_cmsfont_hero/)
    assert.doesNotMatch(typographyCssVariables(typography)["--font-heading"], /CBAFont_cmsfont_hero/)
  })

  it("falls back only the invalid hero reference to the global role", () => {
    const typography = normalizeStorefrontTypography({
      locale: "en",
      heading: { source: "google", family: "Inter" },
      body: { source: "google", family: "Roboto" },
      contexts: { homepage_hero: {
        heading: { source: "custom", family_id: "cmsfont_missing", family: "CBAFont_cmsfont_missing" },
        body: { source: "google", family: "Lato" },
      } },
      custom_faces: [],
    }, "en")
    assert.equal(typography.contexts.homepage_hero.heading.family, "Inter")
    assert.equal(typography.contexts.homepage_hero.body.family, "Lato")
  })
})
