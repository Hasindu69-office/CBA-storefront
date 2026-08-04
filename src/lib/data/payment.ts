"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"
import { HttpTypes } from "@medusajs/types"
import { isWebxpay } from "@lib/constants"

export const listCartPaymentMethods = async (regionId: string) => {
  if (!regionId) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<HttpTypes.StorePaymentProviderListResponse>(
      `/store/payment-providers`,
      {
        method: "GET",
        query: { region_id: regionId },
        headers,
        // Payment provider links change via Admin/setup scripts; never serve a
        // stale force-cached list that omits newly linked gateways like WEBXPAY.
        cache: "no-store",
      }
    )
    .then(({ payment_providers }) =>
      (payment_providers ?? []).sort((a, b) => {
        if (isWebxpay(a.id) && !isWebxpay(b.id)) return -1
        if (!isWebxpay(a.id) && isWebxpay(b.id)) return 1
        return a.id > b.id ? 1 : -1
      })
    )
    .catch(() => {
      return null
    })
}
