import assert from "node:assert/strict"
import test from "node:test"
import { normalizeReviewText, validateReviewInput } from "../review-validation"

test("normalizes review whitespace and accepts valid input", () => {
  assert.equal(normalizeReviewText("  useful review\r\n"), "useful review")
  const result = validateReviewInput({ rating: 5, title: " Great ", content: " Very useful product. " })
  assert.equal(result.valid, true)
  assert.deepEqual(result.value, { rating: 5, title: "Great", content: "Very useful product." })
})

test("validates rating and review length boundaries", () => {
  const result = validateReviewInput({ rating: 0, title: "x".repeat(121), content: "short" })
  assert.equal(result.valid, false)
  assert.ok(result.errors.rating)
  assert.ok(result.errors.title)
  assert.ok(result.errors.content)
})

test("rejects markup and control characters", () => {
  assert.equal(validateReviewInput({ rating: 4, title: "", content: "A <b>scripted</b> review" }).valid, false)
  assert.equal(validateReviewInput({ rating: 4, title: "", content: "Valid text\u0000 hidden" }).valid, false)
})
