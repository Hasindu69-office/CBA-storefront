export function safeCartMutationError(
  error: unknown,
  fallback = "We could not update your cart right now. Please try again."
) {
  const message = error instanceof Error ? error.message : String(error ?? "")

  if (/inventory|stock|available|quantity|reservation|backorder/i.test(message)) {
    return "There is not enough stock available for that quantity. Please reduce the quantity and try again."
  }

  return fallback
}

