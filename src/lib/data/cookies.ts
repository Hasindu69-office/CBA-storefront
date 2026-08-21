import "server-only"
import crypto from "crypto"
import { cookies as nextCookies } from "next/headers"

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "_CBA_Ebiz"
const CART_COOKIE_NAME = process.env.CART_COOKIE_NAME || "_cba_cart_id"
const CACHE_COOKIE_NAME = process.env.CACHE_COOKIE_NAME || "_cba_cache_id"
const LEGACY_AUTH_COOKIE_NAMES = ["_CBA_Ebiz", "_medusa_jwt"].filter(
  (name) => name !== AUTH_COOKIE_NAME
)
const LEGACY_CART_COOKIE_NAMES = ["_medusa_cart_id"].filter(
  (name) => name !== CART_COOKIE_NAME
)
const LEGACY_CACHE_COOKIE_NAMES = ["_medusa_cache_id"].filter(
  (name) => name !== CACHE_COOKIE_NAME
)
const AUTH_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
}

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  try {
    const cookies = await nextCookies()
    const token = firstCookieValue(cookies, [
      AUTH_COOKIE_NAME,
      ...LEGACY_AUTH_COOKIE_NAMES,
    ])

    if (!token) {
      return {}
    }

    return { authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  try {
    const cookies = await nextCookies()
    const cacheId = firstCookieValue(cookies, [
      CACHE_COOKIE_NAME,
      ...LEGACY_CACHE_COOKIE_NAMES,
    ])

    if (!cacheId) {
      return ""
    }

    return `${tag}-${cacheId}`
  } catch (error) {
    return ""
  }
}

export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[] } | {}> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)

  if (!cacheTag) {
    return {}
  }

  return { tags: [`${cacheTag}`] }
}

export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set(AUTH_COOKIE_NAME, token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7,
  })
  LEGACY_AUTH_COOKIE_NAMES.forEach((name) => {
    cookies.set(name, "", {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 0,
    })
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()
  ;[AUTH_COOKIE_NAME, ...LEGACY_AUTH_COOKIE_NAMES].forEach((name) => {
    cookies.set(name, "", {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 0,
    })
    cookies.delete({
      name,
      ...AUTH_COOKIE_OPTIONS,
    })
  })
}

export const getCartId = async () => {
  const cookies = await nextCookies()
  return firstCookieValue(cookies, [
    CART_COOKIE_NAME,
    ...LEGACY_CART_COOKIE_NAMES,
  ])
}

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()
  cookies.set(CART_COOKIE_NAME, cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
  LEGACY_CART_COOKIE_NAMES.forEach((name) => {
    cookies.set(name, "", {
      maxAge: -1,
    })
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()
  ;[CART_COOKIE_NAME, ...LEGACY_CART_COOKIE_NAMES].forEach((name) => {
    cookies.set(name, "", {
      maxAge: -1,
    })
  })
}

export const setOrderConfirmationAccess = async (orderId: string) => {
  const cookies = await nextCookies()
  cookies.set(orderConfirmationCookieName(orderId), signOrderId(orderId), {
    maxAge: 60 * 30,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const hasOrderConfirmationAccess = async (orderId: string) => {
  const cookies = await nextCookies()
  const token = cookies.get(orderConfirmationCookieName(orderId))?.value
  return token === signOrderId(orderId)
}

export const getOrderConfirmationToken = async (orderId: string) => {
  const cookies = await nextCookies()
  const token = cookies.get(orderConfirmationCookieName(orderId))?.value
  if (!token || token !== signOrderId(orderId)) {
    return null
  }
  return token
}

function orderConfirmationCookieName(orderId: string) {
  const digest = crypto.createHash("sha256").update(orderId).digest("hex").slice(0, 24)
  return `_cba_order_confirm_${digest}`
}

function signOrderId(orderId: string) {
  const secret =
    process.env.CBA_STOREFRONT_CONFIRMATION_SECRET ??
    process.env.JWT_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "development-confirmation-secret"
  return crypto.createHmac("sha256", secret).update(orderId).digest("hex")
}

function firstCookieValue(
  cookies: Awaited<ReturnType<typeof nextCookies>>,
  names: string[]
) {
  for (const name of names) {
    const value = cookies.get(name)?.value
    if (value) {
      return value
    }
  }
  return undefined
}

const GUEST_TRACKING_SESSION_COOKIE = "_cba_guest_tracking_session"

export async function setGuestTrackingSessionToken(
  token: string,
  maxAgeSeconds = 30 * 60
) {
  const cookies = await nextCookies()
  cookies.set(GUEST_TRACKING_SESSION_COOKIE, token, {
    maxAge: maxAgeSeconds,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

export async function getGuestTrackingSessionToken() {
  const cookies = await nextCookies()
  return cookies.get(GUEST_TRACKING_SESSION_COOKIE)?.value ?? null
}

export async function clearGuestTrackingSessionToken() {
  const cookies = await nextCookies()
  cookies.set(GUEST_TRACKING_SESSION_COOKIE, "", {
    maxAge: -1,
    path: "/",
  })
}

export async function getReturnIntakeHeaders(): Promise<Record<string, string>> {
  const auth = await getAuthHeaders()
  const guest = await getGuestTrackingSessionToken()
  return {
    ...auth,
    ...(guest ? { "x-cba-guest-tracking-token": guest } : {}),
  }
}
