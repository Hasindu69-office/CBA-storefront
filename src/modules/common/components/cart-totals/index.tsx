"use client"

import { convertToLocale } from "@lib/util/money"
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
  const subtotal = item_subtotal ?? 0
  const shippingBeforeDiscount = shipping_subtotal ?? shipping_total ?? 0
  const shippingAfterDiscount = shipping_total ?? shippingBeforeDiscount
  const shippingDiscount = Math.max(
    shippingBeforeDiscount - shippingAfterDiscount,
    0
  )
  const inferredDiscount = Math.max(
    subtotal + shippingBeforeDiscount - (total ?? 0),
    0
  )
  const totalDiscount = Math.max(
    discount_subtotal ?? 0,
    discount_total ?? 0,
    inferredDiscount
  )
  const productDiscount = Math.max(totalDiscount - shippingDiscount, 0)

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span
            className="text-right"
            data-testid="cart-shipping"
            data-value={shippingAfterDiscount || 0}
          >
            {shippingDiscount > 0 && (
              <span className="block text-xs text-ui-fg-muted line-through">
                {convertToLocale({
                  amount: shippingBeforeDiscount,
                  currency_code,
                })}
              </span>
            )}
            <span className={shippingDiscount > 0 ? "text-ui-fg-interactive" : ""}>
              {shippingAfterDiscount <= 0
                ? "Free"
                : convertToLocale({
                    amount: shippingAfterDiscount,
                    currency_code,
                  })}
            </span>
          </span>
        </div>
        {productDiscount > 0 && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={productDiscount}
            >
              -{" "}
              {convertToLocale({
                amount: productDiscount,
                currency_code,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">Taxes</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
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
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
