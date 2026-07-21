const COUNTRY_CODE_PATTERN = /^[a-z]{2}$/
const configuredDefaultCountryCode =
  process.env.NEXT_PUBLIC_DEFAULT_REGION?.toLowerCase()

export const DEFAULT_COUNTRY_CODE =
  configuredDefaultCountryCode &&
  COUNTRY_CODE_PATTERN.test(configuredDefaultCountryCode)
    ? configuredDefaultCountryCode
    : "lk"

const normalizePath = (path: string) => {
  if (!path) {
    return "/"
  }

  return path.startsWith("/") ? path : `/${path}`
}

export const isCountryCode = (value?: string | null) => {
  return Boolean(value && COUNTRY_CODE_PATTERN.test(value.toLowerCase()))
}

export const getStoreCountryCode = (value?: string | string[] | null) => {
  const countryCode = Array.isArray(value) ? value[0] : value

  if (isCountryCode(countryCode)) {
    return countryCode!.toLowerCase()
  }

  return DEFAULT_COUNTRY_CODE
}

export const stripCountryCodeFromPath = (
  path: string,
  countryCode = DEFAULT_COUNTRY_CODE
) => {
  const normalizedPath = normalizePath(path)
  const normalizedCountryCode = countryCode.toLowerCase()
  const countryPrefix = `/${normalizedCountryCode}`

  if (normalizedPath === countryPrefix) {
    return "/"
  }

  if (normalizedPath.startsWith(`${countryPrefix}/`)) {
    return normalizedPath.slice(countryPrefix.length)
  }

  return normalizedPath
}

export const localizedPath = (path: string) => {
  return stripCountryCodeFromPath(path)
}
