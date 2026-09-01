const CMS_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CMS_SLUG_MAX_LENGTH = 180

export function isValidCmsSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= CMS_SLUG_MAX_LENGTH &&
    CMS_SLUG_PATTERN.test(value)
  )
}

export function safeCmsPath(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }

  const path = value.trim()
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : ""
}

export function safeCmsUrl(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }

  const url = value.trim()
  if (!url) {
    return ""
  }

  if (safeCmsPath(url)) {
    return url
  }

  try {
    const parsed = new URL(url)
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : ""
  } catch {
    return ""
  }
}
