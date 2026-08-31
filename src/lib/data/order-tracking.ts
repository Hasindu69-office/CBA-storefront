"use server"

import { sdk } from "@lib/config"
import {
  clearGuestTrackingSessionToken,
  getAuthHeaders,
  getGuestTrackingSessionToken,
  getOrderConfirmationToken,
  setGuestTrackingSessionToken,
} from "./cookies"
import type {
  CbaAccountOrderDetail,
  CbaAccountOrderListItem,
  CbaCustomerOrderTracking,
} from "types/order-tracking"
import type { CbaReturnEligibility } from "types/return-intake"

const GENERIC_LOOKUP_MESSAGE =
  "If the order details match, a verification code has been sent."

export async function listAccountOrders(limit = 20, offset = 0) {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return null
  }

  return sdk.client
    .fetch<{
      orders: CbaAccountOrderListItem[]
      count: number
      limit: number
      offset: number
    }>("/store/cba/v1/account/orders", {
      method: "GET",
      query: { limit, offset, sort: "created_at_desc" },
      headers,
      cache: "no-store",
    })
    .then((result) => result)
    .catch(() => null)
}

export async function retrieveAccountOrderTracking(orderId: string) {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return null
  }

  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) {
    return null
  }

  return sdk.client
    .fetch<{
      order: CbaAccountOrderDetail
      tracking: CbaCustomerOrderTracking
    }>(`/store/cba/v1/account/orders/${orderId}`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then((result) => ({
      tracking: result.tracking ?? mapDetailToTracking(result.order),
      returnEligibility: result.order?.return_eligibility as CbaReturnEligibility | undefined,
    }))
    .catch(() => null)
}

export async function retrieveOrderTrackingForRequest(orderId: string) {
  const account = await retrieveAccountOrderTracking(orderId)
  if (account?.tracking) {
    return account
  }

  const guest = await retrieveGuestTrackingSession()
  if (guest?.tracking.order.id === orderId) {
    return {
      tracking: guest.tracking,
      returnEligibility: guest.returnEligibility,
    }
  }

  return null
}

export async function guestTrackingLookup(input: {
  order_reference: string
  email?: string
  phone?: string
}) {
  const order_reference = input.order_reference.trim().slice(0, 64)
  const email = input.email?.trim().toLowerCase().slice(0, 254)
  const phone = input.phone?.trim().slice(0, 20)

  if (!order_reference || (!email && !phone)) {
    return {
      ok: false as const,
      error: "Enter your order number and email or phone.",
    }
  }

  try {
    const result = await sdk.client.fetch<{
      ok: boolean
      message: string
      challenge_id: string
      code?: string
    }>("/store/cba/v1/order-tracking/lookup", {
      method: "POST",
      body: {
        order_reference,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      },
      cache: "no-store",
    })
    return {
      ok: true as const,
      message: result.message || GENERIC_LOOKUP_MESSAGE,
      challenge_id: result.challenge_id,
    }
  } catch (error: unknown) {
    const message =
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : null

    if (process.env.NODE_ENV === "development" && message) {
      return {
        ok: false as const,
        error: message,
      }
    }

    return {
      ok: false as const,
      error: "Unable to start order tracking right now. Please try again.",
    }
  }
}

export async function guestTrackingVerify(input: {
  challenge_id: string
  code: string
}) {
  const challenge_id = input.challenge_id.trim()
  const code = input.code.trim()
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(challenge_id) || !/^\d{6}$/.test(code)) {
    return {
      ok: false as const,
      error: "Enter the 6-digit verification code.",
    }
  }

  try {
    const result = await sdk.client.fetch<{
      tracking: CbaCustomerOrderTracking
      return_eligibility?: CbaReturnEligibility
      session_token?: string
      expires_at?: string
    }>("/store/cba/v1/order-tracking/verify", {
      method: "POST",
      body: { challenge_id, code },
      cache: "no-store",
    })

    if (result.session_token) {
      const maxAge = result.expires_at
        ? Math.max(
            60,
            Math.floor(
              (new Date(result.expires_at).getTime() - Date.now()) / 1000
            )
          )
        : 30 * 60
      await setGuestTrackingSessionToken(result.session_token, maxAge)
    }

    return {
      ok: true as const,
      tracking: result.tracking,
      returnEligibility: result.return_eligibility,
    }
  } catch {
    return {
      ok: false as const,
      error: "Verification failed. Please request a new code.",
    }
  }
}

export async function retrieveGuestTrackingSession() {
  const token = await getGuestTrackingSessionToken()
  if (!token) return null

  try {
    const result = await sdk.client.fetch<{
      tracking: CbaCustomerOrderTracking
      return_eligibility?: CbaReturnEligibility
    }>("/store/cba/v1/order-tracking/session", {
      method: "GET",
      headers: {
        "x-cba-guest-tracking-token": token,
      },
      cache: "no-store",
    })
    return {
      tracking: result.tracking,
      returnEligibility: result.return_eligibility,
    }
  } catch {
    await clearGuestTrackingSessionToken()
    return null
  }
}

export async function guestTrackingLogout() {
  const token = await getGuestTrackingSessionToken()
  try {
    await sdk.client.fetch("/store/cba/v1/order-tracking/logout", {
      method: "POST",
      headers: token ? { "x-cba-guest-tracking-token": token } : {},
      cache: "no-store",
    })
  } catch {
    // ignore
  }
  await clearGuestTrackingSessionToken()
}

export type GuestConfirmSessionResult =
  | { ok: true }
  | { ok: false; error: string }

function extractApiErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback
  }
  const payload = error as {
    message?: unknown
    error?: string | { message?: unknown; code?: unknown }
    code?: unknown
  }
  if (payload.error && typeof payload.error === "object") {
    const nested = String(payload.error.message ?? "").trim()
    if (nested) return nested.slice(0, 240)
  }
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim().slice(0, 240)
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim().slice(0, 240)
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 240)
  }
  return fallback
}

/**
 * Mint a Phase 4A guest tracking session from the confirmation cookie so
 * guests can download receipts on the confirmation page without OTP.
 */
export async function establishGuestSessionFromConfirmation(
  orderId: string
): Promise<boolean> {
  const result = await establishGuestSessionFromConfirmationDetailed(orderId)
  return result.ok
}

export async function establishGuestSessionFromConfirmationDetailed(
  orderId: string
): Promise<GuestConfirmSessionResult> {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) {
    return { ok: false, error: "Invalid order id." }
  }

  const auth = await getAuthHeaders()
  if ("authorization" in auth) {
    return { ok: true }
  }

  const existing = await getGuestTrackingSessionToken()
  if (existing) {
    const existingMatchesOrder = await guestTrackingSessionMatchesOrder(
      existing,
      orderId
    )
    if (existingMatchesOrder) {
      return { ok: true }
    }
    await clearGuestTrackingSessionToken()
  }

  const confirmationToken = await getOrderConfirmationToken(orderId)
  if (!confirmationToken) {
    return {
      ok: false,
      error:
        "Confirmation access expired. Use Guest order tracking to verify this order, then download again.",
    }
  }

  return establishGuestSessionFromConfirmationToken(orderId, confirmationToken)
}

export async function establishGuestSessionFromConfirmationToken(
  orderId: string,
  confirmationToken: string
): Promise<GuestConfirmSessionResult> {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) {
    return { ok: false, error: "Invalid order id." }
  }
  if (!/^[a-f0-9]{64}$/i.test(confirmationToken)) {
    return { ok: false, error: "Confirmation access is invalid or expired." }
  }

  try {
    const result = await sdk.client.fetch<{
      session_token: string
      expires_at: string
      message?: string
      error?: string | { message?: string }
    }>("/store/cba/v1/order-tracking/confirm-session", {
      method: "POST",
      body: {
        order_id: orderId,
        confirmation_token: confirmationToken.toLowerCase(),
      },
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!result?.session_token) {
      return {
        ok: false,
        error: extractApiErrorMessage(
          result,
          "Could not create a guest download session."
        ),
      }
    }

    const maxAge = Math.max(
      60,
      Math.floor(
        (new Date(result.expires_at).getTime() - Date.now()) / 1000
      )
    )
    await setGuestTrackingSessionToken(result.session_token, maxAge)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: extractApiErrorMessage(
        error,
        "Guest download session unavailable. Check guest tracking is enabled on the backend."
      ),
    }
  }
}

async function guestTrackingSessionMatchesOrder(token: string, orderId: string) {
  try {
    const result = await sdk.client.fetch<{
      tracking?: CbaCustomerOrderTracking
    }>("/store/cba/v1/order-tracking/session", {
      method: "GET",
      headers: {
        "x-cba-guest-tracking-token": token,
      },
      cache: "no-store",
    })
    return result.tracking?.order?.id === orderId
  } catch {
    return false
  }
}

function mapDetailToTracking(
  order: CbaAccountOrderDetail
): CbaCustomerOrderTracking {
  return {
    order: {
      id: order.id,
      display_id: order.display_id,
      created_at: order.created_at,
      currency_code: order.currency_code,
      status: order.order_status?.key ?? "pending",
      payment_status: order.payment_status?.key ?? "not_paid",
      fulfillment_status: order.fulfillment_status?.key ?? "not_fulfilled",
    },
    items: (order.items ?? []).map((item) => ({
      id: item.line_item_id,
      title: item.title ?? "Item",
      variant_title: item.variant_title,
      thumbnail: item.thumbnail,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    })),
    totals: {
      subtotal: order.subtotal ?? order.total,
      discount_total: order.discount_total ?? 0,
      shipping_total: order.shipping_total ?? 0,
      tax_total: order.tax_total ?? 0,
      total: order.total,
    },
    addresses: {
      shipping: order.shipping_address ?? null,
      billing: order.billing_address ?? null,
    },
    shipping_methods: order.shipping_methods ?? [],
    payment: order.payment ?? {
      status: order.payment_status,
      provider: null,
      amount: order.total,
      currency_code: order.currency_code,
    },
    fulfillments: order.fulfillments ?? [],
    timeline: order.timeline ?? [],
    next_expected_step: order.next_expected_step ?? null,
  }
}
