"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCartId } from "@lib/data/cookies"

export type KokoRedirectPayload = {
  action_url: string
  method: "POST"
  fields: Record<string, string>
  attempt_id: string
  merchant_order_id: string
  amount: string
  currency_code: string
}

type PrepareResponse =
  | { success: true; data: KokoRedirectPayload }
  | { success: false; error?: { code?: string; message?: string } }

export async function prepareKokoRedirectAction(): Promise<
  | { ok: true; data: KokoRedirectPayload }
  | { ok: false; message: string }
> {
  const cartId = await getCartId()
  if (!cartId) {
    return { ok: false, message: "Your cart could not be found." }
  }

  try {
    const response = await sdk.client.fetch<PrepareResponse>(
      "/store/cba/v1/payments/koko/prepare-redirect",
      {
        method: "POST",
        body: { cart_id: cartId },
        headers: { ...(await getAuthHeaders()) },
        cache: "no-store",
      }
    )

    if (!response.success || !response.data?.action_url || !response.data?.fields) {
      return {
        ok: false,
        message:
          response.success === false
            ? response.error?.message ?? "Could not prepare Koko payment. Please try again."
            : "Could not prepare Koko payment. Please try again.",
      }
    }

    let host = ""
    try {
      host = new URL(response.data.action_url).hostname
    } catch {
      return { ok: false, message: "Payment gateway URL is invalid." }
    }
    const allowedHosts = ["qaapi.paykoko.com", "api.paykoko.com", "paykoko.com", "www.paykoko.com"]
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
          : "Could not prepare Koko payment. Please try again.",
    }
  }
}
