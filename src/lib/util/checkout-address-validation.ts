import {
  normalizeEmail,
  normalizeText,
  validateEmail,
  validatePersonName,
  validatePlaceName,
  validateSafeAddressText,
  validateSafeMessageText,
  validateSriLankanPhone,
  validateSriLankanPostalCode,
} from "./storefront-form-validation"

export type CheckoutAddressFieldName =
  | "full_name"
  | "email"
  | "shipping_address.phone"
  | "shipping_address.address_1"
  | "shipping_address.city"
  | "shipping_address.province"
  | "shipping_address.postal_code"
  | "shipping_address.country_code"
  | "delivery_instructions"

export type CheckoutAddressValues = {
  full_name: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address_1: string
  address_2: string
  company: string
  city: string
  province: string
  postal_code: string
  country_code: string
  delivery_instructions: string
}

export type CheckoutAddressValidationResult =
  | {
      ok: true
      values: CheckoutAddressValues
      fieldErrors: Record<string, never>
      formError: null
    }
  | {
      ok: false
      values: CheckoutAddressValues
      fieldErrors: Partial<Record<CheckoutAddressFieldName, string>>
      formError: string
    }

const FIELD_LIMITS: Partial<Record<CheckoutAddressFieldName, number>> = {
  full_name: 160,
  email: 254,
  "shipping_address.phone": 20,
  "shipping_address.address_1": 160,
  "shipping_address.city": 160,
  "shipping_address.province": 160,
  "shipping_address.postal_code": 32,
  "shipping_address.country_code": 2,
  delivery_instructions: 500,
}

export function checkoutAddressValuesFromFormData(
  formData: FormData
): CheckoutAddressValues {
  const fullName = stringField(formData, "full_name")
  const splitName = splitFullName(fullName)

  return {
    full_name: fullName,
    first_name:
      firstAvailableField(formData, ["shipping_address.first_name"]) ||
      splitName.first_name,
    last_name:
      firstAvailableField(formData, ["shipping_address.last_name"]) ||
      splitName.last_name,
    email: normalizeEmail(firstAvailableField(formData, ["email"])),
    phone: firstAvailableField(formData, ["shipping_address.phone"]),
    address_1: firstAvailableField(formData, ["shipping_address.address_1"]),
    address_2: firstAvailableField(formData, ["shipping_address.address_2"]),
    company: firstAvailableField(formData, ["shipping_address.company"]),
    city: firstAvailableField(formData, ["shipping_address.city"]),
    province: firstAvailableField(formData, ["shipping_address.province"]),
    postal_code: firstAvailableField(formData, ["shipping_address.postal_code"]),
    country_code:
      firstAvailableField(formData, ["shipping_address.country_code"]) || "lk",
    delivery_instructions: stringField(formData, "delivery_instructions"),
  }
}

export function validateCheckoutAddressFormData(
  formData: FormData
): CheckoutAddressValidationResult {
  return validateCheckoutAddressValues(checkoutAddressValuesFromFormData(formData))
}

export function validateCheckoutAddressValues(
  values: CheckoutAddressValues
): CheckoutAddressValidationResult {
  const fieldErrors: Partial<Record<CheckoutAddressFieldName, string>> = {}

  addLengthError(fieldErrors, "full_name", values.full_name)
  addLengthError(fieldErrors, "email", values.email)
  addLengthError(fieldErrors, "shipping_address.phone", values.phone)
  addLengthError(fieldErrors, "shipping_address.address_1", values.address_1)
  addLengthError(fieldErrors, "shipping_address.city", values.city)
  addLengthError(fieldErrors, "shipping_address.province", values.province)
  addLengthError(fieldErrors, "shipping_address.postal_code", values.postal_code)
  addLengthError(fieldErrors, "shipping_address.country_code", values.country_code)
  addLengthError(fieldErrors, "delivery_instructions", values.delivery_instructions)

  const fullNameError = validatePersonName(values.full_name, "Full name", {
    max: 160,
  })
  if (fullNameError) fieldErrors.full_name = fullNameError

  const emailError = validateEmail(values.email)
  if (emailError) fieldErrors.email = emailError

  const phoneError = validateSriLankanPhone(values.phone)
  if (phoneError) fieldErrors["shipping_address.phone"] = phoneError

  const addressError = validateSafeAddressText(values.address_1, "Street address", {
    min: 3,
    max: 160,
  })
  if (addressError) fieldErrors["shipping_address.address_1"] = addressError

  const cityError = validatePlaceName(values.city, "City", { max: 80 })
  if (cityError) fieldErrors["shipping_address.city"] = cityError

  const provinceError = validatePlaceName(values.province, "District", {
    max: 80,
  })
  if (provinceError) fieldErrors["shipping_address.province"] = provinceError

  const postalCodeError = validateSriLankanPostalCode(values.postal_code)
  if (postalCodeError) fieldErrors["shipping_address.postal_code"] = postalCodeError

  if (values.country_code.toLowerCase() !== "lk") {
    fieldErrors["shipping_address.country_code"] =
      "Delivery is currently available only in Sri Lanka."
  }
  const instructionsError = validateSafeMessageText(
    values.delivery_instructions,
    "Delivery instructions",
    { required: false, min: 1, max: 500 }
  )
  if (instructionsError) fieldErrors.delivery_instructions = instructionsError

  if (Object.keys(fieldErrors).length) {
    return {
      ok: false,
      values,
      fieldErrors,
      formError: "Please check the highlighted delivery details.",
    }
  }

  return {
    ok: true,
    values,
    fieldErrors: {},
    formError: null,
  }
}

export function firstCheckoutAddressErrorField(
  fieldErrors: Partial<Record<CheckoutAddressFieldName, string>>
) {
  const order: CheckoutAddressFieldName[] = [
    "full_name",
    "shipping_address.phone",
    "email",
    "shipping_address.address_1",
    "shipping_address.city",
    "shipping_address.province",
    "shipping_address.postal_code",
    "delivery_instructions",
    "shipping_address.country_code",
  ]
  return order.find((field) => Boolean(fieldErrors[field])) ?? null
}

function addLengthError(
  fieldErrors: Partial<Record<CheckoutAddressFieldName, string>>,
  field: CheckoutAddressFieldName,
  value: string
) {
  const limit = FIELD_LIMITS[field]
  if (limit && value.length > limit) {
    fieldErrors[field] =
      field === "delivery_instructions"
        ? "Delivery instructions are too long."
        : `${fieldLabel(field)} is too long.`
  }
}

function fieldLabel(field: CheckoutAddressFieldName) {
  if (field === "full_name") return "Full name"
  if (field === "email") return "Email"
  if (field === "delivery_instructions") return "Delivery instructions"
  return field.replace("shipping_address.", "").replace(/_/g, " ")
}

function stringField(formData: FormData, name: string) {
  return normalizeText(formData.get(name))
}

function firstAvailableField(formData: FormData, names: string[]) {
  for (const name of names) {
    const value = stringField(formData, name)
    if (value) {
      return value
    }
  }
  return ""
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    first_name: parts[0] ?? "",
    last_name: parts.slice(1).join(" ") || parts[0] || "",
  }
}
