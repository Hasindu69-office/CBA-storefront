"use server"

import { MEDUSA_BACKEND_URL, sdk } from "@lib/config"

export type ProductDetailBadge = {
  code: string
  label: string
  style_token?: string | null
  priority?: number
}

export type ProductDetailSection = {
  id: string
  type: "description" | "manufacturer" | "benefits" | "feature" | "media"
  title?: string | null
  subtitle?: string | null
  body_html?: string | null
  media_url?: string | null
  media_alt_text?: string | null
  images?: Array<{ url: string; alt_text?: string | null }>
  layout: "text" | "image_full" | "image_left" | "image_right" | "image_grid"
  sort_order: number
  updated_at?: string
}

export type ProductDetailBrand = {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  logo_alt_text?: string | null
}

export type ProductDetailSpecificationGroup = {
  group: {
    id: string
    name: string
    code: string
  }
  specifications: Array<{
    definition_id: string
    value: string | number | boolean | Record<string, unknown> | unknown[] | null
    variant_id?: string | null
    definition?: {
      name?: string
      code?: string
      unit?: string | null
    }
  }>
}

export type ProductDetailRelatedProduct = {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
}

export type ProductDetailResponse = {
  product_id: string
  variant_id: string | null
  brand: ProductDetailBrand | null
  catalog_profile: {
    short_description?: string | null
    condition?: string
    condition_label?: string
    delivery_summary?: string | null
    installment_eligible?: boolean
  } | null
  badges: ProductDetailBadge[]
  warranty: {
    name?: string
    summary?: string | null
    duration_months?: number | null
    coverage_html?: string | null
    exclusions_html?: string | null
    claim_instructions?: string | null
  } | null
  specification_groups: ProductDetailSpecificationGroup[]
  review_summary: {
    average_rating?: number | null
    total_reviews?: number
    rating_counts?: Record<string, number>
  } | null
  relationships: {
    related: ProductDetailRelatedProduct[]
    cross_sell: ProductDetailRelatedProduct[]
    up_sell: ProductDetailRelatedProduct[]
    accessory: ProductDetailRelatedProduct[]
  }
  detail_sections: ProductDetailSection[]
}

export type ProductReview = {
  id: string
  rating: number
  title?: string | null
  content: string
  verified_purchase?: boolean
  customer_display_name?: string | null
  created_at?: string | null
}

export type ProductReviewsResponse = {
  reviews: ProductReview[]
  summary: NonNullable<ProductDetailResponse["review_summary"]>
  count: number
  limit: number
  offset: number
}

type ProductDetailEnvelope =
  | { success: true; data: ProductDetailResponse }
  | { success: false; error?: { message?: string } }

export async function getProductDetail(productId: string, variantId?: string) {
  if (!isSafeMedusaId(productId) || (variantId && !isSafeMedusaId(variantId))) {
    logProductDetailError("Invalid product detail identifier.", { productId, variantId })
    return emptyProductDetail(productId, variantId)
  }

  return sdk.client
    .fetch<ProductDetailEnvelope>(`/store/cba/v1/products/${productId}/detail`, {
      cache: "no-store",
      query: {
        variant_id: variantId,
      },
    })
    .then((payload) => {
      if (!payload.success) {
        throw new Error(payload.error?.message ?? "Product detail request failed.")
      }
      return normalizeProductDetail(payload.data)
    })
    .catch((error) => {
      logProductDetailError("Product detail request failed.", {
        productId,
        variantId,
        error,
      })
      return emptyProductDetail(productId, variantId)
    })
}

export async function getProductReviews(
  productId: string,
  options: { limit?: number; offset?: number; sort?: "recent" | "highest" | "lowest" } = {}
): Promise<ProductReviewsResponse> {
  const limit = clampReviewLimit(options.limit)
  const offset = Math.max(0, Number(options.offset ?? 0))
  const sort = options.sort ?? "recent"

  if (!isSafeMedusaId(productId)) {
    logProductDetailError("Invalid product review identifier.", { productId })
    return emptyProductReviews(limit, offset)
  }

  return sdk.client
    .fetch<ProductReviewsResponse>(`/store/cba/v1/products/${productId}/reviews`, {
      cache: "no-store",
      query: {
        limit,
        offset,
        sort,
      },
    })
    .then(normalizeProductReviews)
    .catch((error) => {
      logProductDetailError("Product reviews request failed.", { productId, error })
      return emptyProductReviews(limit, offset)
    })
}

const SAFE_ID_PATTERN = /^[a-z]+_[A-Za-z0-9_-]+$/

function isSafeMedusaId(value: string) {
  return SAFE_ID_PATTERN.test(value)
}

function normalizeProductDetail(detail: ProductDetailResponse): ProductDetailResponse {
  return {
    ...emptyProductDetail(detail.product_id, detail.variant_id ?? undefined),
    ...detail,
    brand: detail.brand ?? null,
    catalog_profile: detail.catalog_profile ?? null,
    badges: Array.isArray(detail.badges) ? detail.badges : [],
    warranty: detail.warranty ?? null,
    specification_groups: Array.isArray(detail.specification_groups)
      ? detail.specification_groups.map((group) => ({
          ...group,
          specifications: Array.isArray(group.specifications)
            ? group.specifications
            : [],
        }))
      : [],
    review_summary: normalizeReviewSummary(detail.review_summary),
    relationships: {
      related: detail.relationships?.related ?? [],
      cross_sell: detail.relationships?.cross_sell ?? [],
      up_sell: detail.relationships?.up_sell ?? [],
      accessory: detail.relationships?.accessory ?? [],
    },
    detail_sections: (detail.detail_sections ?? []).map((section) => ({
      ...section,
      media_url: normalizeMediaUrl(section.media_url),
      images: section.images?.map((image) => ({
        ...image,
        url: normalizeMediaUrl(image.url) ?? image.url,
      })),
    })),
  }
}

function normalizeMediaUrl(value?: string | null) {
  if (!value) {
    return value
  }

  if (value.startsWith("/uploads/")) {
    return `${MEDUSA_BACKEND_URL.replace(/\/+$/, "")}${value}`
  }

  return value
}

function normalizeProductReviews(payload: ProductReviewsResponse): ProductReviewsResponse {
  return {
    reviews: Array.isArray(payload.reviews) ? payload.reviews : [],
    summary: normalizeReviewSummary(payload.summary),
    count: Number.isFinite(payload.count) ? payload.count : 0,
    limit: clampReviewLimit(payload.limit),
    offset: Math.max(0, Number(payload.offset ?? 0)),
  }
}

function normalizeReviewSummary(summary: ProductDetailResponse["review_summary"]) {
  return {
    average_rating:
      typeof summary?.average_rating === "number" ? summary.average_rating : null,
    total_reviews:
      typeof summary?.total_reviews === "number" ? summary.total_reviews : 0,
    rating_counts: {
      "1": Number(summary?.rating_counts?.["1"] ?? 0),
      "2": Number(summary?.rating_counts?.["2"] ?? 0),
      "3": Number(summary?.rating_counts?.["3"] ?? 0),
      "4": Number(summary?.rating_counts?.["4"] ?? 0),
      "5": Number(summary?.rating_counts?.["5"] ?? 0),
    },
  }
}

function emptyProductDetail(
  productId: string,
  variantId?: string | null
): ProductDetailResponse {
  return {
    product_id: productId,
    variant_id: variantId ?? null,
    brand: null,
    catalog_profile: null,
    badges: [],
    warranty: null,
    specification_groups: [],
    review_summary: normalizeReviewSummary(null),
    relationships: {
      related: [],
      cross_sell: [],
      up_sell: [],
      accessory: [],
    },
    detail_sections: [],
  }
}

function emptyProductReviews(limit: number, offset: number): ProductReviewsResponse {
  return {
    reviews: [],
    summary: normalizeReviewSummary(null),
    count: 0,
    limit,
    offset,
  }
}

function clampReviewLimit(value?: number) {
  const parsed = Number(value ?? 10)
  if (!Number.isInteger(parsed)) {
    return 10
  }
  return Math.min(50, Math.max(1, parsed))
}

function logProductDetailError(message: string, context: Record<string, unknown>) {
  console.warn("[cba-pdp]", message, sanitizeLogContext(context))
}

function sanitizeLogContext(context: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (value instanceof Error) {
        return [key, value.message]
      }
      return [key, value]
    })
  )
}
