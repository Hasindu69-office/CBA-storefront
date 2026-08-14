"use server"

import { MEDUSA_BACKEND_URL } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { addToCart } from "@lib/data/cart"
import { cookies as nextCookies } from "next/headers"
import { revalidatePath } from "next/cache"

const WISHLIST_COOKIE_NAME = "cba_guest_engagement"
const SAFE_ID_PATTERN = /^[a-z]+_[A-Za-z0-9_-]+$/

type WishlistSummary = {
  id: string
  is_default?: boolean
}

export type WishlistProductCard = {
  id: string
  product_id?: string
  handle: string
  title: string
  subtitle: string | null
  thumbnail: { url: string; alt: string } | null
  default_variant: { id: string; title: string; sku: string | null } | null
  price: {
    currency_code: string
    calculated_amount: number | null
    original_amount: number | null
    status: "available" | "unavailable" | "context_required" | "error"
  }
  inventory: {
    purchasable: boolean
    in_stock: boolean
    allow_backorder: boolean
    status: string
  }
}

export type WishlistItem = {
  id: string
  product_id: string
  variant_id: string | null
  availability: "available" | "unavailable" | "product_missing" | "variant_missing"
  created_at: string | null
  product_card: WishlistProductCard | null
}

export type Wishlist = {
  id: string
  name: string
  is_default?: boolean
  visibility?: "private" | "shared"
  item_count: number
  available_item_count: number
  updated_at: string | null
  items: WishlistItem[]
}

type WishlistListResponse = {
  wishlists?: Wishlist[]
}

type WishlistCreateResponse = {
  wishlist?: WishlistSummary
}

type WishlistResponse = {
  wishlist?: Wishlist
}

type WishlistAddItemResponse = {
  item?: WishlistItem
  already_present?: boolean
}

type WishlistCountResponse = {
  item_count?: number
  wishlist_count?: number
}

type WishlistShareResponse = {
  share?: {
    token: string
    expires_at: string
    ttl_days: number
  }
}

type WishlistActionResult =
  | { success: true; status?: "added" | "already_present"; message: string }
  | { success: false; status?: "error"; message: string }

type BulkWishlistActionResult = {
  success: boolean
  message: string
  addedCount: number
  alreadyPresentCount: number
  failedCount: number
}

type WishlistReadResult =
  | { success: true; wishlist: Wishlist | null; message?: string }
  | { success: false; wishlist: null; message: string }

type ShareWishlistResult =
  | { success: true; token: string; expiresAt: string; ttlDays: number }
  | { success: false; message: string }

export async function addFeaturedProductToWishlist({
  productId,
  variantId,
}: {
  productId: string
  variantId: string
}): Promise<WishlistActionResult> {
  return addProductToWishlist({ productId, variantId })
}

export async function addProductToWishlist({
  productId,
  variantId,
}: {
  productId: string
  variantId: string
}): Promise<WishlistActionResult> {
  if (!isSafeMedusaId(productId) || !isSafeMedusaId(variantId)) {
    return {
      success: false,
      status: "error",
      message: "Product selection is invalid.",
    }
  }

  try {
    const authHeaders = await getAuthHeaders()

    if ("authorization" in authHeaders) {
      const wishlist = await getOrCreateCustomerWishlist(authHeaders)
      const result = await medusaFetch<WishlistAddItemResponse>(
        `/store/cba/v1/wishlists/${wishlist.id}/items`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            product_id: productId,
            variant_id: variantId,
          }),
        }
      )

      return wishlistAddResult(result)
    }

    await ensureGuestWishlistSession()
    const result = await medusaFetch<WishlistAddItemResponse>("/store/cba/v1/engagement/wishlist/items", {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        variant_id: variantId,
      }),
    })

    return wishlistAddResult(result)
  } catch (error) {
    return {
      success: false,
      status: "error",
      message: wishlistMessage(error),
    }
  }
}

export async function retrieveWishlist(
  query: Record<string, string | undefined> = {}
): Promise<WishlistReadResult> {
  try {
    const authHeaders = await getAuthHeaders()
    if ("authorization" in authHeaders) {
      const list = await medusaFetch<WishlistListResponse>(
        `/store/cba/v1/wishlists${queryString(query)}`,
        { headers: authHeaders }
      )
      const wishlist =
        list.wishlists?.find((item) => item.is_default) ??
        list.wishlists?.[0] ??
        null
      return { success: true, wishlist }
    }

    const cookieStore = await nextCookies()
    if (!cookieStore.get(WISHLIST_COOKIE_NAME)?.value) {
      return { success: true, wishlist: null }
    }

    const result = await medusaFetch<WishlistResponse>(
      `/store/cba/v1/engagement/wishlist${queryString(query)}`
    )
    return { success: true, wishlist: result.wishlist ?? null }
  } catch (error) {
    return { success: false, wishlist: null, message: wishlistMessage(error) }
  }
}

export async function retrieveWishlistCount() {
  try {
    const authHeaders = await getAuthHeaders()
    if ("authorization" in authHeaders) {
      const result = await medusaFetch<WishlistCountResponse>(
        "/store/cba/v1/wishlists/count",
        { headers: authHeaders }
      )
      return result.item_count ?? 0
    }

    const cookieStore = await nextCookies()
    if (!cookieStore.get(WISHLIST_COOKIE_NAME)?.value) {
      return 0
    }

    const result = await medusaFetch<WishlistResponse>(
      "/store/cba/v1/engagement/wishlist"
    )
    return result.wishlist?.item_count ?? 0
  } catch {
    return 0
  }
}

export async function retrieveSharedWishlist(
  token: string,
  query: Record<string, string | undefined> = {}
): Promise<WishlistReadResult & { expiresAt?: string }> {
  if (!/^[A-Za-z0-9_-]{32,160}$/.test(token)) {
    return {
      success: false,
      wishlist: null,
      message: "Shared wishlist link is invalid.",
    }
  }

  try {
    const result = await medusaFetch<
      WishlistResponse & { share?: { expires_at?: string } }
    >(`/store/cba/v1/wishlist-shares/${token}${queryString(query)}`)
    return {
      success: true,
      wishlist: result.wishlist ?? null,
      expiresAt: result.share?.expires_at,
    }
  } catch (error) {
    return { success: false, wishlist: null, message: wishlistMessage(error) }
  }
}

export async function removeWishlistItem(itemId: string): Promise<WishlistActionResult> {
  if (!isSafeMedusaId(itemId)) {
    return { success: false, message: "Wishlist item is invalid." }
  }

  try {
    const authHeaders = await getAuthHeaders()
    if ("authorization" in authHeaders) {
      const wishlist = await getOrCreateCustomerWishlist(authHeaders)
      await medusaFetch(
        `/store/cba/v1/wishlists/${wishlist.id}/items/${itemId}`,
        { method: "DELETE", headers: authHeaders }
      )
    } else {
      await medusaFetch(`/store/cba/v1/engagement/wishlist/items/${itemId}`, {
        method: "DELETE",
      })
    }
    revalidatePath("/wishlist")
    return { success: true, message: "Removed from wishlist." }
  } catch (error) {
    return { success: false, message: wishlistMessage(error) }
  }
}

export async function removeWishlistItems(itemIds: string[]) {
  const safeIds = Array.from(new Set(itemIds.filter(isSafeMedusaId))).slice(0, 100)
  if (!safeIds.length) {
    return { success: false, message: "Select at least one wishlist item." }
  }
  const results = await Promise.allSettled(safeIds.map((id) => removeWishlistItem(id)))
  const removedCount = results.filter(
    (result) => result.status === "fulfilled" && result.value.success
  ).length
  const failedCount = safeIds.length - removedCount
  return {
    success: removedCount > 0,
    message:
      failedCount === 0
        ? "Selected items removed."
        : `Removed ${removedCount} of ${safeIds.length} selected items.`,
    removedCount,
    failedCount,
  }
}

export async function clearWishlist() {
  const result = await retrieveWishlist()
  if (!result.success || !result.wishlist?.items.length) {
    return {
      success: false,
      message: result.success ? "Wishlist is already empty." : result.message,
      removedCount: 0,
      failedCount: 0,
    }
  }
  return removeWishlistItems(result.wishlist.items.map((item) => item.id))
}

export async function shareWishlist(): Promise<ShareWishlistResult> {
  try {
    const authHeaders = await getAuthHeaders()
    if ("authorization" in authHeaders) {
      const wishlist = await getOrCreateCustomerWishlist(authHeaders)
      const result = await medusaFetch<WishlistShareResponse>(
        `/store/cba/v1/wishlists/${wishlist.id}/share`,
        { method: "POST", headers: authHeaders, body: JSON.stringify({}) }
      )
      return shareResult(result)
    }

    const cookieStore = await nextCookies()
    if (!cookieStore.get(WISHLIST_COOKIE_NAME)?.value) {
      return { success: false, message: "Add items before sharing your wishlist." }
    }
    const result = await medusaFetch<WishlistShareResponse>(
      "/store/cba/v1/engagement/wishlist/share",
      { method: "POST", body: JSON.stringify({}) }
    )
    return shareResult(result)
  } catch (error) {
    return { success: false, message: wishlistMessage(error) }
  }
}

export async function addWishlistItemsToCart({
  items,
  countryCode,
}: {
  items: Array<{ itemId: string; variantId: string | null }>
  countryCode: string
}) {
  const selected = items
    .filter((item) => item.itemId && item.variantId && isSafeMedusaId(item.variantId))
    .slice(0, 100) as Array<{ itemId: string; variantId: string }>

  if (!selected.length) {
    return { success: false, message: "Select at least one available item." }
  }

  let addedCount = 0
  for (const item of selected) {
    try {
      await addToCart({ variantId: item.variantId, quantity: 1, countryCode })
      addedCount += 1
    } catch {
      // Continue so one unavailable line does not block the rest.
    }
  }

  const failedCount = selected.length - addedCount
  return {
    success: addedCount > 0,
    message:
      failedCount === 0
        ? "Selected items added to cart."
        : `Added ${addedCount} of ${selected.length} selected items to cart.`,
    addedCount,
    failedCount,
  }
}

export async function addProductsToWishlist(
  items: Array<{ productId: string; variantId: string }>
): Promise<BulkWishlistActionResult> {
  const normalizedItems = items
    .filter(
      (item) =>
        isSafeMedusaId(item.productId) && isSafeMedusaId(item.variantId)
    )
    .slice(0, 6)

  if (!normalizedItems.length) {
    return {
      success: false,
      message: "Select at least one valid product.",
      addedCount: 0,
      alreadyPresentCount: 0,
      failedCount: 0,
    }
  }

  const results = await Promise.allSettled(
    normalizedItems.map((item) =>
      addProductToWishlist({
        productId: item.productId,
        variantId: item.variantId,
      })
    )
  )

  const successfulResults = results.filter(
    (result): result is PromiseFulfilledResult<WishlistActionResult> =>
      result.status === "fulfilled" && result.value.success
  )
  const addedCount = successfulResults.filter(
    (result) => result.value.status === "added"
  ).length
  const alreadyPresentCount = successfulResults.filter(
    (result) => result.value.status === "already_present"
  ).length
  const successCount = addedCount + alreadyPresentCount
  const failedCount = normalizedItems.length - successCount

  if (addedCount === normalizedItems.length) {
    return {
      success: true,
      message: "Added all selected products to wishlist.",
      addedCount,
      alreadyPresentCount,
      failedCount,
    }
  }

  if (successCount > 0) {
    return {
      success: true,
      message: bulkWishlistMessage({
        addedCount,
        alreadyPresentCount,
        failedCount,
        totalCount: normalizedItems.length,
      }),
      addedCount,
      alreadyPresentCount,
      failedCount,
    }
  }

  return {
    success: false,
    message: "Could not add selected products to wishlist.",
    addedCount,
    alreadyPresentCount,
    failedCount,
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

function queryString(query: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value)
    }
  }
  const text = params.toString()
  return text ? `?${text}` : ""
}

function shareResult(result: WishlistShareResponse): ShareWishlistResult {
  if (!result.share?.token) {
    return { success: false, message: "Wishlist share link could not be created." }
  }
  return {
    success: true,
    token: result.share.token,
    expiresAt: result.share.expires_at,
    ttlDays: result.share.ttl_days,
  }
}

function wishlistAddResult(result: WishlistAddItemResponse): WishlistActionResult {
  if (result.already_present) {
    return {
      success: true,
      status: "already_present",
      message: "This product is already in your wishlist.",
    }
  }
  return {
    success: true,
    status: "added",
    message: "Added to wishlist.",
  }
}

function bulkWishlistMessage({
  addedCount,
  alreadyPresentCount,
  failedCount,
  totalCount,
}: {
  addedCount: number
  alreadyPresentCount: number
  failedCount: number
  totalCount: number
}) {
  const parts: string[] = []
  if (addedCount > 0) {
    parts.push(`${addedCount} ${addedCount === 1 ? "product" : "products"} added.`)
  }
  if (alreadyPresentCount > 0) {
    parts.push(
      `${alreadyPresentCount} ${alreadyPresentCount === 1 ? "was" : "were"} already in your wishlist.`
    )
  }
  if (failedCount > 0) {
    parts.push(`${failedCount} of ${totalCount} could not be added.`)
  }
  return parts.join(" ")
}

function wishlistMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Wishlist request could not be completed."
  if (/abuse protection/i.test(message)) {
    return "Wishlist is temporarily unavailable. Please try again later."
  }
  if (/expired/i.test(message)) {
    return "This wishlist link has expired."
  }
  return message
}
