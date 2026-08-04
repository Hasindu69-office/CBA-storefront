/**
 * Maps stable checkout address validation messages (from cart.ts) to form field names
 * so the client can scroll/focus the related input after a toast notification.
 */
const CHECKOUT_FIELD_BY_MESSAGE: Record<string, string> = {
  "Full name is required.": "full_name",
  "Enter a valid email address.": "email",
  "Enter a valid phone number.": "shipping_address.phone",
  "Street address is required.": "shipping_address.address_1",
  "City is required.": "shipping_address.city",
  "District is required.": "shipping_address.province",
  "Enter a valid postal code.": "shipping_address.postal_code",
  "Delivery instructions contain unsupported characters.": "delivery_instructions",
}

const LENGTH_FIELD_PATTERN = /^([a-z0-9_ ]+) is too long\.$/i

const LENGTH_FIELD_NAME_BY_LABEL: Record<string, string> = {
  first_name: "full_name",
  last_name: "full_name",
  email: "email",
  phone: "shipping_address.phone",
  address_1: "shipping_address.address_1",
  address_2: "shipping_address.address_2",
  city: "shipping_address.city",
  province: "shipping_address.province",
  postal_code: "shipping_address.postal_code",
  delivery_instructions: "delivery_instructions",
}

export function resolveCheckoutValidationFieldName(
  message: string | null | undefined
): string | null {
  if (!message) {
    return null
  }

  const exact = CHECKOUT_FIELD_BY_MESSAGE[message]
  if (exact) {
    return exact
  }

  const lengthMatch = message.match(LENGTH_FIELD_PATTERN)
  if (lengthMatch?.[1]) {
    const key = lengthMatch[1].trim().replace(/\s+/g, "_").toLowerCase()
    return LENGTH_FIELD_NAME_BY_LABEL[key] ?? null
  }

  return null
}

export function focusCheckoutValidationField(
  form: HTMLFormElement | null | undefined,
  message: string | null | undefined
) {
  if (!form || typeof document === "undefined") {
    return
  }

  const fieldName = resolveCheckoutValidationFieldName(message)
  if (!fieldName) {
    form.scrollIntoView({ behavior: "smooth", block: "start" })
    return
  }

  const field = form.elements.namedItem(fieldName)
  const element =
    field instanceof RadioNodeList
      ? (field[0] as HTMLElement | undefined)
      : (field as HTMLElement | null)

  if (!element || typeof element.focus !== "function") {
    form.scrollIntoView({ behavior: "smooth", block: "start" })
    return
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" })
  element.focus({ preventScroll: true })
}
