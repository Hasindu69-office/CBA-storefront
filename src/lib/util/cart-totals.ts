import { convertToLocale } from "./money"

type TotalAddress = {
  address_1?: string | null
}

type TotalLine = {
  is_tax_inclusive?: boolean | null
  tax_lines?: unknown[] | null
}

type TotalShippingMethod = {
  is_tax_inclusive?: boolean | null
  tax_lines?: unknown[] | null
}

export type TotalsSource = {
  currency_code?: string | null
  shipping_address?: TotalAddress | null
  shipping_methods?: TotalShippingMethod[] | null
  items?: TotalLine[] | null
  promotions?: unknown[] | null
  total?: number | null
  subtotal?: number | null
  tax_total?: number | null
  discount_total?: number | null
  discount_subtotal?: number | null
  item_total?: number | null
  item_subtotal?: number | null
  shipping_discount_total?: number | null
  item_tax_total?: number | null
  shipping_tax_total?: number | null
  shipping_total?: number | null
  shipping_subtotal?: number | null
  original_shipping_subtotal?: number | null
  region?: {
    automatic_taxes?: boolean | null
  } | null
}

export type TotalsState =
  | "loading"
  | "address_required"
  | "shipping_required"
  | "tax_pending"
  | "inclusive"
  | "exclusive"
  | "zero_tax"
  | "configuration_unavailable"
  | "calculation_failed"
  | "review_required"
  | "ready"

export type TotalRow = {
  key: string
  label: string
  amount: number
  display: string
  tone?: "default" | "discount" | "success" | "muted"
  testId?: string
}

export type TotalDisplay = {
  currencyCode: string
  rows: TotalRow[]
  total: TotalRow
  states: TotalsState[]
  taxLabel: string
  taxNote: string | null
  shippingDisplay: string
  shippingBeforeDiscountDisplay: string | null
  shippingIsFree: boolean
  hasDiscount: boolean
  discountLabel: string
}

export function formatTotalAmount(
  amount: number | null | undefined,
  currencyCode: string,
  options?: { compact?: boolean }
) {
  return convertToLocale({
    amount: safeAmount(amount),
    currency_code: currencyCode,
    minimumFractionDigits: options?.compact ? 0 : undefined,
    maximumFractionDigits: options?.compact ? 0 : undefined,
  })
}

export function mapAuthoritativeTotals(
  source: TotalsSource | null | undefined,
  options: {
    itemCount?: number
    includeTaxWhenZero?: boolean
    automaticPromotionApplied?: boolean
    reviewRequired?: boolean
    errorState?: Extract<TotalsState, "configuration_unavailable" | "calculation_failed"> | null
    compactMoney?: boolean
  } = {}
): TotalDisplay {
  const currencyCode = source?.currency_code ?? "lkr"
  const states: TotalsState[] = []

  if (!source) {
    states.push("loading")
  }

  const address = source?.shipping_address
  if (source && !address?.address_1) {
    states.push("address_required")
  }
  if (source && !(source.shipping_methods?.length ?? 0)) {
    states.push("shipping_required")
  }
  if (options.reviewRequired) {
    states.push("review_required")
  }
  if (options.errorState) {
    states.push(options.errorState)
  }

  const subtotal = source?.item_subtotal ?? source?.subtotal ?? 0
  const shippingBeforeDiscount =
    source?.shipping_subtotal ?? source?.original_shipping_subtotal ?? source?.shipping_total ?? 0
  const shippingAfterDiscount = source?.shipping_total ?? shippingBeforeDiscount
  const shippingDiscount = source?.shipping_discount_total ?? Math.max(shippingBeforeDiscount - shippingAfterDiscount, 0)
  const discountTotal = source?.discount_total ?? source?.discount_subtotal ?? 0
  const itemDiscount = Math.max(discountTotal - shippingDiscount, 0)
  const itemTax = source?.item_tax_total ?? 0
  const shippingTax = source?.shipping_tax_total ?? 0
  const taxTotal = source?.tax_total ?? 0
  const total = source?.total ?? 0
  const isInclusive = hasInclusivePricing(source)
  const automaticTaxes = source?.region?.automatic_taxes === true
  const hasTaxLines = hasAnyTaxLines(source)

  if (automaticTaxes && !hasTaxLines && !states.includes("address_required") && !states.includes("shipping_required")) {
    states.push("tax_pending")
  } else if (taxTotal <= 0) {
    states.push("zero_tax")
  } else if (isInclusive) {
    states.push("inclusive")
  } else {
    states.push("exclusive")
  }

  if (!states.length) {
    states.push("ready")
  }

  const itemCountLabel =
    typeof options.itemCount === "number"
      ? ` (${options.itemCount} ${options.itemCount === 1 ? "item" : "items"})`
      : ""
  const discountLabel = options.automaticPromotionApplied
    ? "Store discount"
    : "Coupon discount"
  const rows: TotalRow[] = [
    row("subtotal", `Subtotal${itemCountLabel}`, subtotal, currencyCode, options),
  ]

  if (itemDiscount > 0) {
    rows.push(
      row("discount", discountLabel, itemDiscount, currencyCode, options, "discount")
    )
  }

  rows.push(
    row("shipping", "Delivery Fee", shippingAfterDiscount, currencyCode, options, shippingAfterDiscount <= 0 ? "success" : "default")
  )

  if (itemTax > 0) {
    rows.push(row("item-tax", "Item tax", itemTax, currencyCode, options))
  }
  if (shippingTax > 0) {
    rows.push(row("shipping-tax", "Delivery tax", shippingTax, currencyCode, options))
  }
  if (taxTotal > 0 || options.includeTaxWhenZero || states.includes("tax_pending")) {
    rows.push(row("tax", taxLabelFor(states), taxTotal, currencyCode, options))
  }

  return {
    currencyCode,
    rows,
    total: row("total", "Total", total, currencyCode, options),
    states,
    taxLabel: taxLabelFor(states),
    taxNote: taxNoteFor(states),
    shippingDisplay: shippingAfterDiscount <= 0 ? "Free" : formatTotalAmount(shippingAfterDiscount, currencyCode, { compact: options.compactMoney }),
    shippingBeforeDiscountDisplay:
      shippingDiscount > 0
        ? formatTotalAmount(shippingBeforeDiscount, currencyCode, { compact: options.compactMoney })
        : null,
    shippingIsFree: shippingAfterDiscount <= 0,
    hasDiscount: itemDiscount > 0 || shippingDiscount > 0,
    discountLabel,
  }
}

function row(
  key: string,
  label: string,
  amount: number,
  currencyCode: string,
  options: { compactMoney?: boolean },
  tone: TotalRow["tone"] = "default"
): TotalRow {
  return {
    key,
    label,
    amount,
    display: formatTotalAmount(amount, currencyCode, { compact: options.compactMoney }),
    tone,
    testId: key === "subtotal" ? "cart-subtotal" : key === "tax" ? "cart-taxes" : key === "total" ? "cart-total" : undefined,
  }
}

function safeAmount(value: number | null | undefined) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function hasInclusivePricing(source: TotalsSource | null | undefined) {
  const itemsInclusive = source?.items?.some((item) => item.is_tax_inclusive === true)
  const shippingInclusive = source?.shipping_methods?.some(
    (method) => method.is_tax_inclusive === true
  )
  const promotionsInclusive = source?.promotions?.some(
    (promotion) =>
      Boolean(promotion && typeof promotion === "object" && "is_tax_inclusive" in promotion) &&
      (promotion as { is_tax_inclusive?: boolean | null }).is_tax_inclusive === true
  )
  return Boolean(itemsInclusive || shippingInclusive || promotionsInclusive)
}

function hasAnyTaxLines(source: TotalsSource | null | undefined) {
  const itemTaxLines = source?.items?.some((item) => (item.tax_lines?.length ?? 0) > 0)
  const shippingTaxLines = source?.shipping_methods?.some(
    (method) => (method.tax_lines?.length ?? 0) > 0
  )
  return Boolean(itemTaxLines || shippingTaxLines)
}

function taxLabelFor(states: TotalsState[]) {
  if (states.includes("tax_pending")) {
    return "Tax pending"
  }
  if (states.includes("inclusive")) {
    return "Tax included"
  }
  return "Tax"
}

function taxNoteFor(states: TotalsState[]) {
  if (states.includes("tax_pending")) {
    return "Tax will refresh after delivery details are saved."
  }
  if (states.includes("configuration_unavailable")) {
    return "Tax configuration is currently unavailable."
  }
  if (states.includes("calculation_failed")) {
    return "Tax could not be calculated. Retry before placing the order."
  }
  if (states.includes("review_required")) {
    return "Your totals changed. Review them before placing the order."
  }
  if (states.includes("inclusive")) {
    return "Tax is included in the displayed total."
  }
  if (states.includes("exclusive")) {
    return "Tax is added by the checkout total."
  }
  return null
}
