import "server-only"
import crypto from "crypto"
import { cookies as nextCookies } from "next/headers"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

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
    const cacheId = cookies.get("_medusa_cache_id")?.value

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
  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", "", {
    maxAge: -1,
  })
}

export const getCartId = async () => {
  const cookies = await nextCookies()
  return cookies.get("_medusa_cart_id")?.value
}

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", "", {
    maxAge: -1,
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
