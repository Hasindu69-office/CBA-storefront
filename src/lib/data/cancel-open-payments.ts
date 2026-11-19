"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCartId } from "@lib/data/cookies"

type CancelResponse =
  | {
      success: true
      data: {
        cart_id: string
        koko_cancelled: number
        webxpay_cancelled: number
      }
    }
  | { success: false; error?: { code?: string; message?: string } }

/**
 * Best-effort: close open gateway payment attempts for the current cart.
 * Used when the shopper cancels / lands on a non-success payment result.
 */
export async function cancelOpenPaymentAttemptsAction(reason?: string): Promise<void> {
  const cartId = await getCartId()
  if (!cartId) return

  try {
    await sdk.client.fetch<CancelResponse>(
      "/store/cba/v1/payments/cancel-open-attempts",
      {
        method: "POST",
        body: {
          cart_id: cartId,
          ...(reason ? { reason } : {}),
        },
        headers: { ...(await getAuthHeaders()) },
        cache: "no-store",
      }
    )
  } catch {
    // Never block checkout navigation if cancel marking fails.
  }
}
