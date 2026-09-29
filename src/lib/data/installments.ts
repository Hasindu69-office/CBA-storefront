"use server"

import { MEDUSA_BACKEND_URL, sdk } from "@lib/config"
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

export type CheckoutPaymentSelection = {
  payment_mode: "standard" | "installment"
  provider_id: string
  selected_installment_plan: SelectedInstallmentPlanSnapshot | null
  payment_session: { id: string; provider_id: string; status: string }
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

export async function selectCheckoutPayment(input: {
  cartId: string
  providerId: string
  mode: "standard" | "installment"
  installmentPlanId?: string | null
}) {
  if (
    !SAFE_CART_ID_PATTERN.test(input.cartId) ||
    !/^pp_[A-Za-z0-9_-]+$/.test(input.providerId) ||
    (input.mode === "installment" &&
      (!input.installmentPlanId || !SAFE_PLAN_ID_PATTERN.test(input.installmentPlanId))) ||
    (input.mode === "standard" && input.installmentPlanId)
  ) {
    throw new Error("Payment selection is invalid.")
  }

  const headers = { ...(await getAuthHeaders()) }
  const response = await sdk.client.fetch<Envelope<CheckoutPaymentSelection>>(
    "/store/cba/v1/checkout/payment-selection",
    {
      method: "POST",
      body: {
        cart_id: input.cartId,
        provider_id: input.providerId,
        mode: input.mode,
        ...(input.installmentPlanId
          ? { installment_plan_id: input.installmentPlanId }
          : {}),
      },
      headers,
      cache: "no-store",
    }
  )
  if (!response.success) {
    throw new Error(response.error?.message ?? "Payment method could not be updated.")
  }
  await revalidateCartData()
  return response.data
}
