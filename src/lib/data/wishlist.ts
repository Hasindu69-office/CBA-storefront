"use server"

import { MEDUSA_BACKEND_URL } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { cookies as nextCookies } from "next/headers"

const WISHLIST_COOKIE_NAME = "cba_guest_engagement"
const SAFE_ID_PATTERN = /^[a-z]+_[A-Za-z0-9_-]+$/

type WishlistSummary = {
  id: string
  is_default?: boolean
}

type WishlistListResponse = {
  wishlists?: WishlistSummary[]
}

type WishlistCreateResponse = {
  wishlist?: WishlistSummary
}

type WishlistActionResult =
  | { success: true; message: string }
  | { success: false; message: string }

export async function addFeaturedProductToWishlist({
  productId,
  variantId,
}: {
  productId: string
  variantId: string
}): Promise<WishlistActionResult> {
  if (!isSafeMedusaId(productId) || !isSafeMedusaId(variantId)) {
    return { success: false, message: "Product selection is invalid." }
  }

  try {
    const authHeaders = await getAuthHeaders()

    if ("authorization" in authHeaders) {
      const wishlist = await getOrCreateCustomerWishlist(authHeaders)
      await medusaFetch(`/store/cba/v1/wishlists/${wishlist.id}/items`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          product_id: productId,
          variant_id: variantId,
        }),
      })

      return { success: true, message: "Added to wishlist." }
    }

    await ensureGuestWishlistSession()
    await medusaFetch("/store/cba/v1/engagement/wishlist/items", {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        variant_id: variantId,
      }),
    })

    return { success: true, message: "Added to wishlist." }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Wishlist request could not be completed.",
    }
  }
}

async function getOrCreateCustomerWishlist(headers: Record<string, string>) {
  const list = await medusaFetch<WishlistListResponse>("/store/cba/v1/wishlists", {
    headers,
  })
  const existing =
    list.wishlists?.find((wishlist) => wishlist.is_default) ??
    list.wishlists?.[0]

  if (existing?.id) {
    return existing
  }

  const created = await medusaFetch<WishlistCreateResponse>("/store/cba/v1/wishlists", {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "Default wishlist" }),
  })

  if (!created.wishlist?.id) {
    throw new Error("Wishlist could not be created.")
  }

  return created.wishlist
}

async function ensureGuestWishlistSession() {
  const cookieStore = await nextCookies()
  if (cookieStore.get(WISHLIST_COOKIE_NAME)?.value) {
    return
  }

  await medusaFetch("/store/cba/v1/engagement/session", {
    method: "POST",
  })
}

async function medusaFetch<T = unknown>(
  path: string,
  init: Omit<RequestInit, "headers"> & { headers?: Record<string, string> } = {}
): Promise<T> {
  const cookieStore = await nextCookies()
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...publishableKeyHeader(),
    ...guestCookieHeader(cookieStore.get(WISHLIST_COOKIE_NAME)?.value),
    ...(init.headers ?? {}),
  }

  const response = await fetch(`${MEDUSA_BACKEND_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })

  await propagateGuestCookie(response.headers.get("set-cookie"))

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorPayload = payload as {
      error?: { message?: unknown }
      message?: unknown
    }
    const message =
      typeof errorPayload.error?.message === "string"
        ? errorPayload.error.message
        : typeof errorPayload.message === "string"
        ? errorPayload.message
        : "Wishlist request could not be completed."
    throw new Error(message)
  }

  return payload as T
}

async function propagateGuestCookie(setCookie: string | null) {
  if (!setCookie || !setCookie.startsWith(`${WISHLIST_COOKIE_NAME}=`)) {
    return
  }

  const value = setCookie
    .split(";")[0]
    .slice(WISHLIST_COOKIE_NAME.length + 1)

  if (!value) {
    return
  }

  const expires = setCookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith("expires="))
    ?.slice("expires=".length)

  const cookieStore = await nextCookies()
  cookieStore.set(WISHLIST_COOKIE_NAME, decodeURIComponent(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expires ? new Date(expires) : undefined,
  })
}

function guestCookieHeader(value?: string): Record<string, string> {
  return value ? { cookie: `${WISHLIST_COOKIE_NAME}=${encodeURIComponent(value)}` } : {}
}

function publishableKeyHeader(): Record<string, string> {
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  return key ? { "x-publishable-api-key": key } : {}
}

function isSafeMedusaId(value: string) {
  return SAFE_ID_PATTERN.test(value)
}
