"use client"

import { convertToLocale } from "@lib/util/money"
import { mapAuthoritativeTotals } from "@lib/util/cart-totals"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    shipping_total?: number | null
    discount_subtotal?: number | null
    discount_total?: number | null
    shipping_discount_total?: number | null
    original_shipping_subtotal?: number | null
    shipping_methods?: Array<{
      is_tax_inclusive?: boolean | null
      tax_lines?: unknown[] | null
    }> | null
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    shipping_total,
    discount_subtotal,
    discount_total,
  } = totals
  const mapped = mapAuthoritativeTotals(totals, { includeTaxWhenZero: true })
  const productDiscount =
    mapped.rows.find((row) => row.key === "discount")?.amount ?? 0

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {mapped.rows.find((row) => row.key === "subtotal")?.display ??
              convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        {mapped.shippingVisible && (
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span
              className="text-right"
              data-testid="cart-shipping"
              data-value={shipping_total || 0}
            >
              {mapped.shippingBeforeDiscountDisplay && (
                <span className="block text-xs text-ui-fg-muted line-through">
                  {mapped.shippingBeforeDiscountDisplay}
                </span>
              )}
              <span
                className={
                  mapped.shippingIsFree || mapped.hasDiscount
                    ? "text-ui-fg-interactive"
                    : ""
                }
              >
                {mapped.shippingDisplay}
              </span>
            </span>
          </div>
        )}
        {productDiscount > 0 && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={productDiscount}
            >
              -{" "}
              {mapped.rows.find((row) => row.key === "discount")?.display}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">{mapped.taxLabel}</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {mapped.rows.find((row) => row.key === "tax")?.display ??
              convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {mapped.total.display}
        </span>
      </div>
      {mapped.taxNote && (
        <p className="mt-2 text-right text-xs text-ui-fg-muted" aria-live="polite">
          {mapped.taxNote}
        </p>
      )}
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
