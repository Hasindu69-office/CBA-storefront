"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"
import { revalidatePath } from "next/cache"
import { validateReviewInput, type ReviewFieldErrors } from "@lib/util/review-validation"

export type ReviewStatus = "pending" | "approved" | "flagged"
export type CustomerReview = {
  id: string
  product_id: string
  product: { id: string; title: string | null; handle: string | null } | null
  rating: number
  title: string | null
  content: string
  status: ReviewStatus
  verified_purchase: boolean
  customer_display_name: string
  created_at: string | null
  updated_at: string | null
  order_id?: string | null
  order_line_item_id?: string | null
}
export type EligibleReviewPurchase = {
  product_id: string
  product_title: string
  product_handle: string | null
  thumbnail: string | null
  order_id: string
  order_display_id: string | number | null
  order_line_item_id: string
  delivered_at: string | null
}
export type ReviewSubmissionState = {
  success: boolean
  message: string
  code?: string
  fieldErrors?: ReviewFieldErrors
  review?: CustomerReview
}

type ReviewErrorEnvelope = { type?: string; error?: { code?: string; message?: string } }
type Page<T> = { reviews?: T[]; purchases?: T[]; count: number; limit: number; offset: number }

export async function listReviewEligibility(options: { product_id?: string; limit?: number; offset?: number } = {}) {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return { purchases: [], count: 0, limit: options.limit ?? 20, offset: options.offset ?? 0 }
  return sdk.client.fetch<Page<EligibleReviewPurchase>>("/store/cba/v1/account/reviews/eligibility", {
    headers,
    cache: "no-store",
    query: { product_id: options.product_id, limit: options.limit ?? 20, offset: options.offset ?? 0 },
  }).catch(() => ({ purchases: [], count: 0, limit: options.limit ?? 20, offset: options.offset ?? 0 }))
}

export async function listCustomerReviews(options: { limit?: number; offset?: number; sort?: "recent" | "highest" | "lowest" } = {}) {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return { reviews: [], count: 0, limit: options.limit ?? 20, offset: options.offset ?? 0 }
  return sdk.client.fetch<Page<CustomerReview>>("/store/cba/v1/account/reviews", {
    headers,
    cache: "no-store",
    query: { limit: options.limit ?? 20, offset: options.offset ?? 0, sort: options.sort ?? "recent" },
  }).catch(() => ({ reviews: [], count: 0, limit: options.limit ?? 20, offset: options.offset ?? 0 }))
}

export async function submitReview(
  _previous: ReviewSubmissionState,
  formData: FormData
): Promise<ReviewSubmissionState> {
  const productId = String(formData.get("product_id") ?? "")
  const orderId = String(formData.get("order_id") ?? "")
  const lineItemId = String(formData.get("order_line_item_id") ?? "")
  const idempotencyKey = String(formData.get("idempotency_key") ?? "")
  const validation = validateReviewInput({
    rating: Number(formData.get("rating")),
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
  })
  if (!validation.valid) return { success: false, message: "Check the highlighted fields.", fieldErrors: validation.errors }
  if (![productId, orderId, lineItemId].every(isSafeId) || !/^[A-Za-z0-9._:-]{8,120}$/.test(idempotencyKey)) {
    return { success: false, message: "This review request is invalid. Please refresh and try again." }
  }
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return { success: false, code: "REVIEW_NOT_OWNED", message: "Please sign in to submit a review." }
  try {
    const result = await sdk.client.fetch<{ review: CustomerReview }>(`/store/cba/v1/products/${productId}/reviews`, {
      method: "POST",
      headers,
      body: {
        rating: validation.value.rating,
        title: validation.value.title || null,
        content: validation.value.content,
        order_id: orderId,
        order_line_item_id: lineItemId,
        idempotency_key: idempotencyKey,
      },
    })
    revalidatePath("/account/reviews")
    revalidatePath("/account/orders")
    return { success: true, message: "Thanks. Your review was submitted successfully.", review: result.review }
  } catch (error) {
    const mapped = mapReviewError(error)
    return { success: false, ...mapped }
  }
}

function isSafeId(value: string) { return /^[a-z]+_[A-Za-z0-9_-]+$/.test(value) }

function mapReviewError(error: unknown) {
  const data = (error as any)?.response?.data as ReviewErrorEnvelope | undefined
  const code = data?.error?.code ?? "REVIEW_PROVIDER_UNAVAILABLE"
  const messages: Record<string, string> = {
    REVIEW_NOT_OWNED: "Please sign in again before submitting your review.",
    REVIEW_NOT_ELIGIBLE: "This purchase is not eligible for a review yet.",
    REVIEW_ALREADY_EXISTS: "You have already reviewed this product.",
    REVIEW_RATE_LIMITED: "Too many attempts. Please wait before trying again.",
    REVIEW_VALIDATION_FAILED: "Check your review and try again.",
    PRODUCT_NOT_REVIEWABLE: "This product is not currently available for reviews.",
    REVIEW_PROVIDER_UNAVAILABLE: "Reviews are temporarily unavailable. Please try again later.",
  }
  return { code, message: messages[code] ?? messages.REVIEW_PROVIDER_UNAVAILABLE }
}
