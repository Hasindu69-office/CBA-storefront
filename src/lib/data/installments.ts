"use server"

import { MEDUSA_BACKEND_URL, sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"

import { getAuthHeaders, getCacheTag } from "./cookies"

const SAFE_CART_ID_PATTERN = /^cart_[A-Za-z0-9_-]+$/
const SAFE_PLAN_ID_PATTERN = /^cbaip_[A-Za-z0-9_-]+$/

export type StoreInstallmentPlan = {
  id: string
  bank_name: string
  bank_code: string
  webxpay_gateway_id: string
  tenor_months: number
  fee_percentage: number
  logo_path: string | null
  monthly_amount?: number
}

export type StoreInstallmentEligibility = {
  eligible: boolean
  reason: string | null
} | null

export type StoreInstallmentPlansResponse = {
  installment_plans: StoreInstallmentPlan[]
  amount?: number
  currency_code: string
  cart_eligibility?: StoreInstallmentEligibility
}

export type SelectedInstallmentPlanSnapshot = {
  plan_id: string
  bank_name: string
  bank_code: string
  webxpay_gateway_id: string
  tenor_months: number
  fee_percentage: number
  logo_path: string | null
  selected_at: string
}

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error?: { message?: string } }

async function revalidateCartData() {
  const cacheTag = await getCacheTag("carts")
  if (cacheTag) {
    revalidateTag(cacheTag)
  }
}

export async function listInstallmentPlans(input?: {
  amount?: number | null
  cartId?: string | null
}) {
  const query: Record<string, string> = {}
  if (Number.isFinite(Number(input?.amount)) && Number(input?.amount) >= 0) {
    query.amount = String(input?.amount)
  }
  if (input?.cartId && SAFE_CART_ID_PATTERN.test(input.cartId)) {
    query.cart_id = input.cartId
  }

  const response = await sdk.client.fetch<Envelope<StoreInstallmentPlansResponse>>(
    "/store/cba/v1/installments/plans",
    {
      method: "GET",
      query,
      cache: "no-store",
    }
  )

  if (!response.success) {
    throw new Error(
      response.error?.message ?? "Installment plans could not be loaded."
    )
  }

  return {
    ...response.data,
    installment_plans: response.data.installment_plans.map((plan) => ({
      ...plan,
      logo_path: normalizeLogoUrl(plan.logo_path),
    })),
  }
}

function normalizeLogoUrl(value: string | null) {
  if (!value) {
    return value
  }

  if (value.startsWith("/uploads/")) {
    return `${MEDUSA_BACKEND_URL.replace(/\/+$/, "")}${value}`
  }

  return value
}

export async function selectInstallmentPlan(cartId: string, planId: string) {
  if (!SAFE_CART_ID_PATTERN.test(cartId) || !SAFE_PLAN_ID_PATTERN.test(planId)) {
    throw new Error("Installment plan selection is invalid.")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<Envelope<{ selected_installment_plan: SelectedInstallmentPlanSnapshot }>>(
      "/store/cba/v1/installments/selection",
      {
        method: "POST",
        body: {
          cart_id: cartId,
          installment_plan_id: planId,
        },
        headers,
        cache: "no-store",
      }
    )
    .then(async (response) => {
      if (!response.success) {
        throw new Error(
          response.error?.message ?? "Installment plan could not be selected."
        )
      }
      await revalidateCartData()
      return response.data.selected_installment_plan
    })
    .catch(medusaError)
}

export async function clearInstallmentPlan(cartId: string) {
  if (!SAFE_CART_ID_PATTERN.test(cartId)) {
    throw new Error("Cart is invalid.")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<Envelope<{ selected_installment_plan: null }>>(
      "/store/cba/v1/installments/selection",
      {
        method: "POST",
        body: {
          cart_id: cartId,
          installment_plan_id: null,
        },
        headers,
        cache: "no-store",
      }
    )
    .then(async (response) => {
      if (!response.success) {
        throw new Error(
          response.error?.message ?? "Installment plan could not be cleared."
        )
      }
      await revalidateCartData()
      return null
    })
    .catch(medusaError)
}
