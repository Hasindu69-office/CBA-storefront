import type { FeaturedProductCard } from "@lib/data/featured-products"

export type CompareRowValue = {
  id: string
  label: string
  source_type: "specification" | "native_price" | "native_inventory" | "catalog_profile"
  specification_definition_id?: string | null
  value: unknown
  sort_order?: number
  group_sort_order?: number
}

export function buildCompareRows(
  products: FeaturedProductCard[],
  specs: Array<{ productId: string; rows: CompareRowValue[] }>
) {
  const rows = [
    {
      id: "native-product-type",
      label: "Product Type",
      values: Object.fromEntries(products.map((product) => [product.id, product.category?.name ?? "N/A"])),
    },
  ]
  const order: Array<{ id: string; label: string; sortOrder: number; groupSortOrder: number }> = []
  const valuesByRow = new Map<string, Record<string, string>>()

  for (const item of specs) {
    item.rows.forEach((row, index) => {
      if (row.source_type === "native_price" || row.source_type === "native_inventory") return
      const rowId = row.id || row.specification_definition_id || row.label
      if (!valuesByRow.has(rowId)) {
        valuesByRow.set(rowId, {})
        order.push({
          id: rowId,
          label: row.label,
          sortOrder: Number(row.sort_order ?? index),
          groupSortOrder: Number(row.group_sort_order ?? 0),
        })
      }
      valuesByRow.get(rowId)![item.productId] = formatCompareValue(row.value)
    })
  }

  order
    .sort((left, right) =>
      left.groupSortOrder - right.groupSortOrder ||
      left.sortOrder - right.sortOrder ||
      left.label.localeCompare(right.label)
    )
    .forEach((row) => rows.push({
      id: row.id,
      label: row.label,
      values: Object.fromEntries(products.map((product) => [
        product.id,
        valuesByRow.get(row.id)?.[product.id] ?? "N/A",
      ])),
    }))

  rows.push(
    {
      id: "native-stock",
      label: "Stock",
      values: Object.fromEntries(products.map((product) => [product.id, inventoryLabel(product.inventory.status)])),
    },
    {
      id: "native-price",
      label: "Price",
      values: Object.fromEntries(products.map((product) => [product.id, formatProductCardPrice(product)])),
    }
  )
  return rows
}

export function formatCompareValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "N/A"
  if (Array.isArray(value)) {
    const formatted = value.map(formatCompareValue).filter((item) => item !== "N/A")
    return formatted.length ? formatted.join(", ") : "N/A"
  }
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "object") {
    const values = Object.values(value as Record<string, unknown>)
      .map(formatCompareValue)
      .filter((item) => item !== "N/A")
    return values.length ? values.join(" x ") : "N/A"
  }
  return String(value)
}

function formatProductCardPrice(product: FeaturedProductCard) {
  if (product.price.status !== "available" || product.price.calculated_amount === null) {
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
