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

