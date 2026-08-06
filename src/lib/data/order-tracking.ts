"use server"

import { sdk } from "@lib/config"
import {
  clearGuestTrackingSessionToken,
  getAuthHeaders,
  getGuestTrackingSessionToken,
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
