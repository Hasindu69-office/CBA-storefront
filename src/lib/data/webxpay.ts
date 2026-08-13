"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCartId } from "@lib/data/cookies"

export type WebxpayRedirectPayload = {
  action_url: string
  method: "POST"
  fields: Record<string, string>
  attempt_id: string
  merchant_order_id: string
  amount: string
  currency_code: string
}

type PrepareResponse =
  | {
      success: true
      data: WebxpayRedirectPayload
    }
  | {
      success: false
      error?: {
        code?: string
        message?: string
      }
    }

export async function prepareWebxpayRedirectAction(): Promise<
  | { ok: true; data: WebxpayRedirectPayload }
  | { ok: false; message: string }
> {
  const cartId = await getCartId()
  if (!cartId) {
    return { ok: false, message: "Your cart could not be found." }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    const response = await sdk.client.fetch<PrepareResponse>(
      "/store/cba/v1/payments/webxpay/prepare-redirect",
      {
        method: "POST",
        body: { cart_id: cartId },
        headers,
        cache: "no-store",
      }
    )

    if (!response.success || !response.data?.action_url || !response.data?.fields) {
      const message =
        "success" in response && response.success === false
          ? response.error?.message
          : undefined
      return {
        ok: false,
        message: message ?? "Could not prepare WEBXPAY payment. Please try again.",
      }
    }

    const allowedHosts = [
      "stagingxpay.info",
      "webxpay.com",
      "www.webxpay.com",
    ]
    let host = ""
    try {
      host = new URL(response.data.action_url).hostname
    } catch {
      return { ok: false, message: "Payment gateway URL is invalid." }
    }
    if (!allowedHosts.includes(host)) {
      return { ok: false, message: "Payment gateway URL is not allowed." }
    }

    return { ok: true, data: response.data }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Could not prepare WEBXPAY payment. Please try again.",
    }
  }
}
