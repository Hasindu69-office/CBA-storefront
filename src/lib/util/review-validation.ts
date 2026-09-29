export type ReviewFieldErrors = Partial<Record<"rating" | "title" | "content", string>>

export function normalizeReviewText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
}

export function validateReviewInput(input: { rating: number; title: string; content: string }) {
  const errors: ReviewFieldErrors = {}
  const title = normalizeReviewText(input.title)
  const content = normalizeReviewText(input.content)
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    errors.rating = "Choose a rating from 1 to 5 stars."
  }
  if (title.length > 120) errors.title = "The title must be 120 characters or fewer."
  if (content.length < 10) errors.content = "Your review must be at least 10 characters."
  else if (content.length > 3000) errors.content = "Your review must be 3000 characters or fewer."
  if (/<[^>]+>|javascript:|[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/i.test(`${title}\n${content}`)) {
    errors.content = "Reviews cannot contain HTML, scripts, or unsupported characters."
  }
  return { valid: Object.keys(errors).length === 0, errors, value: { rating: input.rating, title, content } }
}
