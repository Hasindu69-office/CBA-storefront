"use server"

import { sdk } from "@lib/config"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import { getRegion } from "@lib/data/regions"
import {
  clampCompareLimit,
  DEFAULT_COMPARE_LIMIT,
  MAX_COMPARE_LIMIT,
  normalizeCompareIds,
} from "@lib/util/compare-products"
import { buildCompareRows } from "@lib/util/compare-table"

export type CompareGroup = {
  id: string
  name: string
  code: string
  description?: string | null
  max_compare_products?: number | null
  row_mode?: "automatic" | "manual"
}

export type ComparisonCategory = { id: string; name: string; handle?: string | null }

export type CompareSpecRow = {
  id: string
  compare_group_id: string | null
  label: string
  source_type:
    | "specification"
    | "native_price"
    | "native_inventory"
    | "catalog_profile"
  specification_definition_id?: string | null
  native_field_key?: string | null
  catalog_profile_field_key?: string | null
  value: unknown
  sort_order?: number
  group_sort_order?: number
  is_automatic?: boolean
}

export type CompareTableRow = {
  id: string
  label: string
  values: Record<string, string>
}

export type ComparePageData = {
  requestedIds: string[]
  products: FeaturedProductCard[]
  compareGroup: CompareGroup | null
  comparisonCategory: ComparisonCategory | null
  rowMode: "automatic" | "manual"
  maxProducts: number
  rows: CompareTableRow[]
  warnings: string[]
  rejectedIds: string[]
}

type SuccessEnvelope<T> = { success: true; data: T }
type ErrorEnvelope = { success: false; error?: { message?: string } }

type ProductCardsEnvelope =
  | SuccessEnvelope<{ products: FeaturedProductCard[] }>
  | ErrorEnvelope

type CompareSpecsEnvelope =
  | SuccessEnvelope<{
      compare_group: CompareGroup | null
      comparison_category: ComparisonCategory | null
      row_mode: "automatic" | "manual"
      max_compare_products: number
      rows: CompareSpecRow[]
    }>
  | ErrorEnvelope

type CompareSearchEnvelope =
  | SuccessEnvelope<{ products: FeaturedProductCard[] }>
  | ErrorEnvelope

type CompareValidationEnvelope =
  | SuccessEnvelope<{
      compare_group: CompareGroup | null
      comparison_category: ComparisonCategory | null
      row_mode: "automatic" | "manual"
      max_compare_products: number
      approved_ids: string[]
      rejected_ids: string[]
    }>
  | ErrorEnvelope

async function validateCompareProducts(ids: string[], categoryId?: string | null) {
  const payload = await sdk.client.fetch<CompareValidationEnvelope>(
    "/store/cba/v1/compare/validate",
    {
      method: "POST",
      cache: "no-store",
      body: { ids, ...(categoryId ? { category_id: categoryId } : {}) },
    }
  )

  if (!payload.success) {
    throw new Error(payload.error?.message ?? "Compare validation failed.")
  }

  return payload.data
}

export async function getComparePageData({
  ids,
  countryCode,
  categoryId,
}: {
  ids?: string | string[] | null
  countryCode: string
  categoryId?: string | null
}): Promise<ComparePageData> {
  const requestedIds = normalizeCompareIds(ids, MAX_COMPARE_LIMIT)
  if (!requestedIds.length) {
    return emptyComparePageData(requestedIds)
  }

  const warnings: string[] = []
  let validation: Awaited<ReturnType<typeof validateCompareProducts>>
  try {
    validation = await validateCompareProducts(requestedIds, categoryId)
  } catch (error) {
    return {
      ...emptyComparePageData(requestedIds),
      rejectedIds: requestedIds,
      warnings: [safeErrorMessage(error, "Comparison could not be validated.")],
    }
  }

  const products = await getCompareProductCards(validation.approved_ids, countryCode).catch(
    (error) => {
      warnings.push(safeErrorMessage(error, "Products could not be loaded."))
      return []
    }
  )
  const productIds = products.map((product) => product.id)
  if (!productIds.length) {
    return {
      ...emptyComparePageData(requestedIds),
      rejectedIds: requestedIds,
      warnings: warnings.length ? warnings : ["Selected products are unavailable."],
    }
  }

  const specs = await Promise.all(
    productIds.map(async (productId) => {
      try {
        return await getProductCompareSpecifications(
          productId,
          validation.comparison_category?.id ?? null
        )
      } catch (error) {
        warnings.push("Some selected product comparison data is unavailable.")
        return emptyProductCompareSpecifications(productId)
      }
    })
  )

  const compareGroup = validation.compare_group
  const maxProducts = clampCompareLimit(
    Number(validation.max_compare_products ?? compareGroup?.max_compare_products ?? DEFAULT_COMPARE_LIMIT)
  )
  const compatibleSpecs = specs.filter(
    (item) => item.comparisonCategory?.id === validation.comparison_category?.id
  )
  const compatibleProductIds = new Set(products.map((product) => product.id))
  const visibleProducts = products
    .filter((product) => compatibleProductIds.has(product.id))
    .slice(0, maxProducts)
  const visibleIds = new Set(visibleProducts.map((product) => product.id))
  const visibleSpecs = compatibleSpecs.filter((item) => visibleIds.has(item.productId))
  const rejectedIds = Array.from(
    new Set([
      ...validation.rejected_ids,
      ...validation.approved_ids.filter((productId) => !visibleIds.has(productId)),
    ])
  )

  if (rejectedIds.length) {
    warnings.push("Some selected products were removed because they are not eligible for this comparison.")
  }

  return {
    requestedIds,
    products: visibleProducts,
    compareGroup,
    comparisonCategory: validation.comparison_category,
    rowMode: validation.row_mode,
    maxProducts,
    rows: buildCompareRows(visibleProducts, visibleSpecs),
    warnings: uniqueWarnings(warnings),
    rejectedIds,
  }
}

export async function searchCompareProducts({
  query,
  countryCode,
  limit = 8,
}: {
  query: string
  countryCode: string
  limit?: number
}) {
  const q = cleanSearchQuery(query)
  if (!q) {
    return []
  }

  const safeLimit = Number.isInteger(limit) ? Math.min(12, Math.max(1, limit)) : 8
  const region = await getRegion(countryCode)
  const payload = await sdk.client.fetch<CompareSearchEnvelope>(
    "/store/cba/v1/search",
    {
      cache: "no-store",
      query: {
        q,
        limit: safeLimit,
        offset: 0,
        sort: "relevance",
        country_code: countryCode,
        region_id: region?.id,
        currency_code: region?.currency_code,
      },
    }
  )

  if (!payload.success) {
    throw new Error(payload.error?.message ?? "Product search failed.")
  }

  return Array.isArray(payload.data.products) ? payload.data.products : []
}

async function getCompareProductCards(ids: string[], countryCode: string) {
  const region = await getRegion(countryCode)
  const payload = await sdk.client.fetch<ProductCardsEnvelope>(
    "/store/cba/v1/products/cards",
    {
      cache: "no-store",
      query: {
        ids: ids.join(","),
        country_code: countryCode,
        region_id: region?.id,
        currency_code: region?.currency_code,
      },
    }
  )

  if (!payload.success) {
    throw new Error(payload.error?.message ?? "Product card request failed.")
  }

  const productMap = new Map(payload.data.products.map((product) => [product.id, product]))
  return ids.map((id) => productMap.get(id)).filter(Boolean) as FeaturedProductCard[]
}

async function getProductCompareSpecifications(productId: string, categoryId?: string | null) {
  const payload = await sdk.client.fetch<CompareSpecsEnvelope>(
    `/store/cba/v1/products/${productId}/compare-specifications`,
    {
      cache: "no-store",
      query: categoryId ? { category_id: categoryId } : undefined,
    }
  )

  if (!payload.success) {
    throw new Error(payload.error?.message ?? "Compare specification request failed.")
  }

  return {
    productId,
    compareGroup: payload.data.compare_group,
    comparisonCategory: payload.data.comparison_category,
    rowMode: payload.data.row_mode,
    rows: Array.isArray(payload.data.rows) ? payload.data.rows : [],
  }
}

function emptyProductCompareSpecifications(productId: string) {
  return {
    productId,
    compareGroup: null,
    comparisonCategory: null,
    rowMode: "automatic" as const,
    rows: [] as CompareSpecRow[],
  }
}

function emptyComparePageData(requestedIds: string[]): ComparePageData {
  return {
    requestedIds,
    products: [],
    compareGroup: null,
    comparisonCategory: null,
    rowMode: "automatic",
    maxProducts: DEFAULT_COMPARE_LIMIT,
    rows: [],
    warnings: [],
    rejectedIds: [],
  }
}

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function uniqueWarnings(warnings: string[]) {
  return Array.from(new Set(warnings.filter(Boolean))).slice(0, 4)
}

function cleanSearchQuery(value: string) {
  const text = value.trim()
  if (text.length < 2) {
    return ""
  }
  return text.slice(0, 120)
}
