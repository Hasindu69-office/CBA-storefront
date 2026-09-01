"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

export type CbaAccountDashboardProfile = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  company_name: string | null
  has_account: boolean
  default_billing_address_id: string | null
  default_shipping_address_id: string | null
  created_at: string | null
  updated_at: string | null
  address_count: number
  wishlist_count: number
}

export type CbaAccountDashboardOrder = {
  id: string
  display_id: number | string
  custom_display_id: string | null
  created_at: string
  updated_at: string
  currency_code: string
  total: number
  item_count: number
  order_status: { key: string; label: string }
  payment_status: { key: string; label: string }
  fulfillment_status: { key: string; label: string }
  thumbnail: string | null
  primary_item_title: string | null
  additional_item_count: number
}

export type CbaAccountDashboard = {
  profile: CbaAccountDashboardProfile
  total_order_count: number
  total_spent: Array<{ currency_code: string; total: number }>
  total_spent_is_partial: boolean
  in_progress_order_count: number
  wishlist_item_count: number
  address_count: number
  recent_orders: CbaAccountDashboardOrder[]
}

export async function retrieveAccountDashboard(recentLimit = 5) {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return null
  }

  return sdk.client
    .fetch<CbaAccountDashboard>("/store/cba/v1/account/dashboard", {
      method: "GET",
      query: {
        recent_limit: recentLimit,
      },
      headers,
      cache: "no-store",
    })
    .catch(() => null)
}
