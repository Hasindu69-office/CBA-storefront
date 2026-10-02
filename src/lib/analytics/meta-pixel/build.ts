import type { MetaCommerceInput, MetaEcommerceParams, MetaLineInput } from "./types"

function safeAmount(value: number | null | undefined): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined
  }
  return Math.round(value * 100) / 100
}

function normalizeLines(lines: MetaLineInput[]): MetaLineInput[] {
  const byProduct = new Map<string, MetaLineInput>()

  for (const line of lines) {
    const productId = typeof line.productId === "string" ? line.productId.trim() : ""
    if (!productId) continue
    const quantity =
      typeof line.quantity === "number" && Number.isInteger(line.quantity) && line.quantity > 0
        ? line.quantity
        : 0
    if (quantity < 1) continue

    const existing = byProduct.get(productId)
    if (existing) {
      existing.quantity += quantity
      if (existing.itemPrice == null && line.itemPrice != null) {
        existing.itemPrice = line.itemPrice
      }
      if (!existing.title && line.title) existing.title = line.title
    } else {
      byProduct.set(productId, {
        productId,
        quantity,
        itemPrice: line.itemPrice,
        title: line.title,
      })
    }
  }

  return Array.from(byProduct.values())
}

/**
 * Builds allow-listed Meta ecommerce params from storefront commerce data.
 * Uses Medusa product ids as content_ids (content_type: product).
 */
export function buildMetaEcommerceParams(
  input: MetaCommerceInput
): MetaEcommerceParams {
  const lines = normalizeLines(input.lines)
  const content_ids = lines.map((line) => line.productId)
  const contents = lines.map((line) => {
    const item: { id: string; quantity: number; item_price?: number } = {
      id: line.productId,
      quantity: line.quantity,
    }
    const price = safeAmount(line.itemPrice ?? undefined)
    if (price !== undefined) item.item_price = price
    return item
  })

  const num_items = lines.reduce((sum, line) => sum + line.quantity, 0)

  let value = safeAmount(input.value ?? undefined)
  if (value === undefined) {
    const fromLines = lines.reduce((sum, line) => {
      const price = safeAmount(line.itemPrice ?? undefined)
      return price === undefined ? sum : sum + price * line.quantity
    }, 0)
    if (fromLines > 0 || lines.every((line) => line.itemPrice != null)) {
      value = Math.round(fromLines * 100) / 100
    }
  }

  const currency =
    typeof input.currency === "string" && input.currency.trim()
      ? input.currency.trim().toUpperCase()
      : undefined

  const content_name =
    typeof input.contentName === "string" && input.contentName.trim()
      ? input.contentName.trim()
      : lines.length === 1 && lines[0]?.title
        ? String(lines[0].title).trim()
        : undefined

  const params: MetaEcommerceParams = {
    content_type: "product",
  }

  if (content_ids.length) params.content_ids = content_ids
  if (contents.length) params.contents = contents
  if (num_items > 0) params.num_items = num_items
  if (value !== undefined) params.value = value
  if (currency) params.currency = currency
  if (content_name) params.content_name = content_name
  if (typeof input.eventID === "string" && input.eventID.trim()) {
    params.eventID = input.eventID.trim()
  }

  return params
}

export function buildSingleProductParams(input: {
  productId: string
  quantity?: number
  value?: number | null
  currency?: string | null
  contentName?: string | null
  itemPrice?: number | null
}): MetaEcommerceParams {
  return buildMetaEcommerceParams({
    lines: [
      {
        productId: input.productId,
        quantity: input.quantity ?? 1,
        itemPrice: input.itemPrice ?? input.value,
        title: input.contentName,
      },
    ],
    currency: input.currency,
    value: input.value ?? input.itemPrice,
    contentName: input.contentName,
  })
}

type CartLikeLine = {
  product_id?: string | null
  quantity?: number | null
  unit_price?: number | null
  total?: number | null
  subtotal?: number | null
  product_title?: string | null
  title?: string | null
}

/** Maps Medusa cart/order line items to Meta line input (product ids only). */
export function linesFromCartLikeItems(
  items: CartLikeLine[] | null | undefined
): MetaLineInput[] {
  if (!items?.length) return []
  const lines: MetaLineInput[] = []
  for (const item of items) {
    const productId =
      typeof item.product_id === "string" ? item.product_id.trim() : ""
    if (!productId) continue
    const quantity =
      typeof item.quantity === "number" && Number.isInteger(item.quantity)
        ? item.quantity
        : 0
    if (quantity < 1) continue
    const unit =
      safeAmount(item.unit_price ?? undefined) ??
      (typeof item.total === "number" && quantity > 0
        ? safeAmount(item.total / quantity)
        : typeof item.subtotal === "number" && quantity > 0
          ? safeAmount(item.subtotal / quantity)
          : undefined)
    lines.push({
      productId,
      quantity,
      itemPrice: unit,
      title: item.product_title ?? item.title,
    })
  }
  return lines
}
