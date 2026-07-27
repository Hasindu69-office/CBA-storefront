"use server"

import { sdk } from "@lib/config"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import { getRegion } from "@lib/data/regions"
import {
  clampCompareLimit,
  DEFAULT_COMPARE_LIMIT,
  normalizeCompareIds,
} from "@lib/util/compare-products"

export type CompareGroup = {
  id: string
  name: string
  code: string
  description?: string | null
  max_compare_products?: number | null
}

export type CompareSpecRow = {
  id: string
  compare_group_id: string
  label: string
  source_type: "specification" | "native" | "catalog_profile"
  specification_definition_id?: string | null
  native_field_key?: string | null
  catalog_profile_field_key?: string | null
  value: unknown
  sort_order?: number
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
  maxProducts: number
  rows: CompareTableRow[]
  warnings: string[]
}

type SuccessEnvelope<T> = { success: true; data: T }
type ErrorEnvelope = { success: false; error?: { message?: string } }

type ProductCardsEnvelope =
  | SuccessEnvelope<{ products: FeaturedProductCard[] }>
  | ErrorEnvelope

type CompareSpecsEnvelope =
  | SuccessEnvelope<{ compare_group: CompareGroup | null; rows: CompareSpecRow[] }>
  | ErrorEnvelope

type CompareSearchEnvelope =
  | SuccessEnvelope<{ products: FeaturedProductCard[] }>
  | ErrorEnvelope

export async function getComparePageData({
  ids,
  countryCode,
}: {
  ids?: string | string[] | null
  countryCode: string
}): Promise<ComparePageData> {
  const requestedIds = normalizeCompareIds(ids, DEFAULT_COMPARE_LIMIT)
  if (!requestedIds.length) {
    return emptyComparePageData(requestedIds)
  }

  const warnings: string[] = []
  const products = await getCompareProductCards(requestedIds, countryCode).catch(
    (error) => {
      warnings.push(safeErrorMessage(error, "Products could not be loaded."))
      return []
    }
  )
  const productIds = products.map((product) => product.id)
  if (!productIds.length) {
    return {
      ...emptyComparePageData(requestedIds),
      warnings: warnings.length ? warnings : ["Selected products are unavailable."],
    }
  }

  const specs = await Promise.all(
    productIds.map((productId) =>
      getProductCompareSpecifications(productId).catch(() => {
        return emptyProductCompareSpecifications(productId)
      })
    )
  )

  const compareGroup = specs.find((item) => item.compareGroup)?.compareGroup ?? null
  const maxProducts = clampCompareLimit(
    Number(compareGroup?.max_compare_products ?? DEFAULT_COMPARE_LIMIT)
  )
  const compatibleSpecs = compareGroup
    ? specs.filter((item) => item.compareGroup?.id === compareGroup.id)
    : specs
  const compatibleProductIds = new Set(
    compareGroup ? compatibleSpecs.map((item) => item.productId) : productIds
  )
  const visibleProducts = products
    .filter((product) => compatibleProductIds.has(product.id))
    .slice(0, maxProducts)
  const visibleIds = new Set(visibleProducts.map((product) => product.id))
  const visibleSpecs = compatibleSpecs.filter((item) => visibleIds.has(item.productId))

  if (visibleProducts.length < products.length) {
    warnings.push("Some selected products were hidden because they are not compatible.")
  }

  return {
    requestedIds,
    products: visibleProducts,
    compareGroup,
    maxProducts,
    rows: buildCompareRows(visibleProducts, visibleSpecs),
    warnings: uniqueWarnings(warnings),
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

async function getProductCompareSpecifications(productId: string) {
  const payload = await sdk.client.fetch<CompareSpecsEnvelope>(
    `/store/cba/v1/products/${productId}/compare-specifications`,
    {
      cache: "no-store",
    }
  )

  if (!payload.success) {
    throw new Error(payload.error?.message ?? "Compare specification request failed.")
  }

  return {
    productId,
    compareGroup: payload.data.compare_group,
    rows: Array.isArray(payload.data.rows) ? payload.data.rows : [],
  }
}

function emptyProductCompareSpecifications(productId: string) {
  return {
    productId,
    compareGroup: null,
    rows: [] as CompareSpecRow[],
  }
}

function buildCompareRows(
  products: FeaturedProductCard[],
  specs: Array<{ productId: string; rows: CompareSpecRow[] }>
) {
  const rows: CompareTableRow[] = [
    {
      id: "native-product-type",
      label: "Product Type",
      values: Object.fromEntries(
        products.map((product) => [product.id, product.category?.name ?? "N/A"])
      ),
    },
  ]

  const rowOrder: Array<{ id: string; label: string; sortOrder: number }> = []
  const valuesByRow = new Map<string, Record<string, string>>()

  specs.forEach((item) => {
    item.rows.forEach((row, index) => {
      const rowId = row.id || row.specification_definition_id || row.label
      if (!valuesByRow.has(rowId)) {
        valuesByRow.set(rowId, {})
        rowOrder.push({
          id: rowId,
          label: row.label,
          sortOrder: Number(row.sort_order ?? index),
        })
      }
      valuesByRow.get(rowId)![item.productId] = formatCompareValue(row.value)
    })
  })

  rowOrder
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((row) => {
      rows.push({
        id: row.id,
        label: row.label,
        values: Object.fromEntries(
          products.map((product) => [
            product.id,
            valuesByRow.get(row.id)?.[product.id] ?? "N/A",
          ])
        ),
      })
    })

  rows.push(
    {
      id: "native-stock",
      label: "Stock",
      values: Object.fromEntries(
        products.map((product) => [product.id, inventoryLabel(product.inventory.status)])
      ),
    },
    {
      id: "native-price",
      label: "Price",
      values: Object.fromEntries(
        products.map((product) => [product.id, formatProductCardPrice(product)])
      ),
    }
  )

  return rows
}

function formatCompareValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "N/A"
  }
  if (Array.isArray(value)) {
    const formatted = value.map(formatCompareValue).filter((item) => item !== "N/A")
    return formatted.length ? formatted.join(", ") : "N/A"
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  if (typeof value === "object") {
    const values = Object.values(value as Record<string, unknown>)
      .map(formatCompareValue)
      .filter((item) => item !== "N/A")
    return values.length ? values.join(" x ") : "N/A"
  }
  return String(value)
}

function formatProductCardPrice(product: FeaturedProductCard) {
  if (
    product.price.status !== "available" ||
    product.price.calculated_amount === null
  ) {
    return "Contact for price"
  }

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: product.price.currency_code.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(product.price.calculated_amount)
}

function inventoryLabel(status: FeaturedProductCard["inventory"]["status"]) {
  if (status === "in_stock" || status === "not_managed") return "In Stock"
  if (status === "low_stock") return "Low stock"
  if (status === "backorder") return "Available on backorder"
  if (status === "out_of_stock") return "Out of stock"
  return "Availability pending"
}

function emptyComparePageData(requestedIds: string[]): ComparePageData {
  return {
    requestedIds,
    products: [],
    compareGroup: null,
    maxProducts: DEFAULT_COMPARE_LIMIT,
    rows: [],
    warnings: [],
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
