"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRight } from "@medusajs/icons"

type CartSummaryPanelProps = {
  cart: HttpTypes.StoreCart
  hasDirtyQuantities: boolean
  isUpdating: boolean
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  return !cart?.shipping_address?.address_1 || !cart.email
    ? "address"
    : "payment"
}

function money(amount: number | null | undefined, currencyCode: string) {
  return convertToLocale({
    amount: amount ?? 0,
    currency_code: currencyCode,
  })
}

export default function CartSummaryPanel({
  cart,
  hasDirtyQuantities,
  isUpdating,
}: CartSummaryPanelProps) {
  const totals = cart as HttpTypes.StoreCart & {
    discount_subtotal?: number | null
  }
  const itemCount =
    cart.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
  const disabled = hasDirtyQuantities || isUpdating
  const checkoutHref = `/checkout?step=${getCheckoutStep(cart)}`
  const subtotal = cart.item_subtotal ?? cart.subtotal ?? 0
  const shippingBeforeDiscount =
    cart.shipping_subtotal ?? cart.shipping_total ?? 0
  const shippingAfterDiscount = cart.shipping_total ?? shippingBeforeDiscount
  const shippingDiscount = Math.max(
    shippingBeforeDiscount - shippingAfterDiscount,
    0
  )
  const inferredDiscount = Math.max(
    subtotal + shippingBeforeDiscount - (cart.total ?? 0),
    0
  )
  const totalDiscount = Math.max(
    totals.discount_subtotal ?? 0,
    cart.discount_total ?? 0,
    inferredDiscount
  )
  const productDiscount = Math.max(totalDiscount - shippingDiscount, 0)
  const hasAutomaticPromotions = Boolean(
    cart.promotions?.some((promotion) => promotion.is_automatic)
  )

  return (
    <section className="rounded-md border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-[20px] font-bold text-[#111111]">Order Summary</h2>
      <div className="mt-6 flex flex-col gap-5 text-[14px]">
        <div className="flex items-start justify-between gap-4">
          <span className="text-[#111111]">Subtotal ({itemCount} items)</span>
          <span className="font-medium text-[#333740]">
            {money(subtotal, cart.currency_code)}
          </span>
        </div>
        {productDiscount > 0 && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-[#111111]">
              {hasAutomaticPromotions ? "Store discount" : "Discount"}
            </span>
            <span className="font-medium text-brand">
              -{money(productDiscount, cart.currency_code)}
            </span>
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <span className="text-[#111111]">Shipping</span>
          <span className="text-right">
            {shippingDiscount > 0 && (
              <span className="block text-[13px] font-medium text-[#8b90a0] line-through">
                {money(shippingBeforeDiscount, cart.currency_code)}
              </span>
            )}
            <span
              className={`font-medium ${
                shippingDiscount > 0 ? "text-[#27a137]" : "text-[#333740]"
              }`}
            >
              {shippingAfterDiscount <= 0
                ? "Free"
                : money(shippingAfterDiscount, cart.currency_code)}
            </span>
            {shippingDiscount > 0 && (
              <span className="mt-1 block text-[12px] font-semibold text-[#27a137]">
                Free shipping applied
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="my-7 h-px bg-gray-100" />

      <div className="flex items-start justify-between gap-4">
        <span className="text-[16px] font-bold text-[#111111]">Total</span>
        <span className="text-right">
          <span className="block text-[20px] font-bold text-brand">
            {money(cart.total, cart.currency_code)}
          </span>
          <span className="mt-1 block text-[12px] text-[#8b90a0]">
            Inclusive of VAT
          </span>
        </span>
      </div>

      {disabled ? (
        <button
          type="button"
          disabled
          className="mt-7 inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md bg-brand px-5 text-[15px] font-semibold text-white opacity-60"
          data-testid="checkout-button"
          title="Update your cart before checkout"
        >
          Proceed to Checkout
          <ArrowRight />
        </button>
      ) : (
        <LocalizedClientLink
          href={checkoutHref}
          className="mt-7 inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-brand px-5 text-[15px] font-semibold text-white transition hover:bg-brand-hover"
          data-testid="checkout-button"
        >
          Proceed to Checkout
          <ArrowRight />
        </LocalizedClientLink>
      )}

      {hasDirtyQuantities && (
        <p className="mt-3 text-center text-[12px] text-[#7a8190]">
          Update your cart to refresh totals before checkout.
        </p>
      )}
    </section>
  )
}
