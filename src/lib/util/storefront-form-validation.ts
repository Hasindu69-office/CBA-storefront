export const EMAIL_MAX_LENGTH = 254
export const SRI_LANKA_PHONE_EXAMPLE = "+94768545236"
export const SRI_LANKA_LANDLINE_PHONE_EXAMPLE = "+94112365869"
export const SRI_LANKA_PHONE_FORMAT_EXAMPLES =
  `${SRI_LANKA_PHONE_EXAMPLE} or ${SRI_LANKA_LANDLINE_PHONE_EXAMPLE}`
export const SRI_LANKA_PHONE_MAX_LENGTH = 12

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SRI_LANKA_MOBILE_PATTERN = /^\+947\d{8}$/
const SRI_LANKA_FIXED_AREA_CODES = new Set([
  "11",
  "21",
  "23",
  "24",
  "25",
  "26",
  "27",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "41",
  "45",
  "47",
  "51",
  "52",
  "54",
  "55",
  "57",
  "63",
  "65",
  "66",
  "67",
  "81",
  "91",
])
const PERSON_NAME_PATTERN = /^[A-Za-z][A-Za-z.' -]*$/
const PLACE_NAME_PATTERN = /^[A-Za-z][A-Za-z.' -]*$/
const POSTAL_CODE_PATTERN = /^\d{5}$/
const CONTROL_PATTERN = /[\u0000-\u001f\u007f]/
const UNSAFE_TEXT_PATTERN = /[<>]/
const SAFE_ADDRESS_PATTERN = /^[A-Za-z0-9\s.,'()#\/-]+$/
const SAFE_MESSAGE_PATTERN = /^[A-Za-z0-9\s.,'()#\/&:;!?@+-]+$/

export function normalizeEmail(value: unknown) {
  return textValue(value).toLowerCase()
}

export function normalizeText(value: unknown) {
  return textValue(value)
}

export function sanitizePersonNameInput(value: string) {
  return value.replace(/[^A-Za-z.' -]/g, "")
}

export function sanitizePlaceNameInput(value: string) {
  return value.replace(/[^A-Za-z.' -]/g, "")
}

export function sanitizeSriLankanPhoneInput(value: string) {
  let next = value.replace(/[^\d+]/g, "")
  next = next.replace(/(?!^)\+/g, "")
  return next.slice(0, SRI_LANKA_PHONE_MAX_LENGTH)
}

export function validateEmail(value: string, label = "email address") {
  if (!value || value.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(value)) {
    return `Enter a valid ${label}.`
  }
  return null
}

export function validateSriLankanPhone(
  value: string,
  { required = true }: { required?: boolean } = {}
) {
  return validateSriLankanPhoneNumber(value, { required })
}

export function validateSriLankanPhoneNumber(
  value: string,
  { required = true }: { required?: boolean } = {}
) {
  if (!value) {
    return required ? "Enter a valid Sri Lankan phone number." : null
  }
  if (!isSriLankanPhoneNumber(value)) {
    return `Use Sri Lankan phone format ${SRI_LANKA_PHONE_FORMAT_EXAMPLES}.`
  }
  return null
}

export function isSriLankanPhoneNumber(value: string) {
  if (SRI_LANKA_MOBILE_PATTERN.test(value)) {
    return true
  }
  if (!/^\+94\d{9}$/.test(value)) {
    return false
  }
  const nationalSignificantNumber = value.slice(3)
  const areaCode = nationalSignificantNumber.slice(0, 2)
  return SRI_LANKA_FIXED_AREA_CODES.has(areaCode)
}

export function validatePersonName(
  value: string,
  label: string,
  { required = true, max = 80 }: { required?: boolean; max?: number } = {}
) {
  const trimmed = value.trim()
  if (!trimmed) {
    return required ? `${label} is required.` : null
  }
  if (trimmed.length < 2 || trimmed.length > max) {
    return `${label} must be between 2 and ${max} characters.`
  }
  if (!PERSON_NAME_PATTERN.test(trimmed) || /\d/.test(trimmed)) {
    return `${label} must start with a letter and cannot contain numbers.`
  }
  if (CONTROL_PATTERN.test(trimmed) || UNSAFE_TEXT_PATTERN.test(trimmed)) {
    return `${label}${label.endsWith("s") ? " contain" : " contains"} invalid characters.`
  }
  return null
}

export function validatePlaceName(
  value: string,
  label: string,
  { required = true, max = 80 }: { required?: boolean; max?: number } = {}
) {
  const trimmed = value.trim()
  if (!trimmed) {
    return required ? `${label} is required.` : null
  }
  if (trimmed.length < 2 || trimmed.length > max) {
    return `${label} must be between 2 and ${max} characters.`
  }
  if (!PLACE_NAME_PATTERN.test(trimmed) || /\d/.test(trimmed)) {
    return `${label} must start with a letter and cannot contain numbers.`
  }
  if (CONTROL_PATTERN.test(trimmed) || UNSAFE_TEXT_PATTERN.test(trimmed)) {
    return `${label}${label.endsWith("s") ? " contain" : " contains"} invalid characters.`
  }
  return null
}

export function validateSriLankanPostalCode(
  value: string,
  { required = true }: { required?: boolean } = {}
) {
  if (!value) {
    return required ? "Postal code is required." : null
  }
  return POSTAL_CODE_PATTERN.test(value)
    ? null
    : "Enter a valid 5-digit Sri Lankan postal code."
}

export function validateSafeAddressText(
  value: string,
  label: string,
  { required = true, min = 3, max = 160 }: { required?: boolean; min?: number; max?: number } = {}
) {
  const trimmed = value.trim()
  if (!trimmed) {
    return required ? `${label} is required.` : null
  }
  if (trimmed.length < min || trimmed.length > max) {
    return `${label} must be between ${min} and ${max} characters.`
  }
  if (CONTROL_PATTERN.test(trimmed) || UNSAFE_TEXT_PATTERN.test(trimmed) || !SAFE_ADDRESS_PATTERN.test(trimmed)) {
    return `${label}${label.endsWith("s") ? " contain" : " contains"} invalid characters.`
  }
  return null
}

export function validateSafeMessageText(
  value: string,
  label: string,
  { required = true, min = 1, max = 2000 }: { required?: boolean; min?: number; max?: number } = {}
) {
  const trimmed = value.trim()
  if (!trimmed) {
    return required ? `${label} is required.` : null
  }
  if (trimmed.length < min || trimmed.length > max) {
    return `${label} must be between ${min} and ${max} characters.`
  }
  if (CONTROL_PATTERN.test(trimmed) || UNSAFE_TEXT_PATTERN.test(trimmed) || !SAFE_MESSAGE_PATTERN.test(trimmed)) {
    return `${label}${label.endsWith("s") ? " contain" : " contains"} invalid characters.`
  }
  return null
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}
