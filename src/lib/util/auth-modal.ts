export type AuthView = "sign-in" | "register" | "forgot-password" | "reset-password"

export type AuthIntent = {
  behavior: "preserve-context" | "navigate-after-auth"
  destination?: string
}

export function safeAuthDestination(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null
  }

  try {
    const url = new URL(value, "https://storefront.invalid")
    if (url.origin !== "https://storefront.invalid") return null
    if (/\\|[\u0000-\u001f\u007f]/.test(value)) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function routeHostedAuthDestination(
  pathname: string,
  search = "",
  hash = ""
) {
  if (/\/account\/(?:forgot-password|reset-password|email-change\/confirm)\/?$/.test(pathname)) {
    return "/account"
  }
  const normalizedSearch = search && !search.startsWith("?") ? `?${search}` : search
  const normalizedHash = hash && !hash.startsWith("#") ? `#${hash}` : hash
  return safeAuthDestination(`${pathname}${normalizedSearch}${normalizedHash}`) ?? "/account"
}

