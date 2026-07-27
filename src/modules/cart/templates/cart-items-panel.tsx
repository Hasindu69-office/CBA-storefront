"use client"

import { applyPromotions, updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowPath, ArrowLeft } from "@medusajs/icons"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import CartCouponForm from "./cart-coupon-form"
import CartLineItemRow from "./cart-line-item-row"
import CartSummaryPanel from "./cart-summary-panel"
import CartTrustPanel from "./cart-trust-panel"

type CartItemsPanelProps = {
  cart: HttpTypes.StoreCart & {
    promotions?: HttpTypes.StorePromotion[]
  }
}

export default function CartItemsPanel({ cart }: CartItemsPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        (cart.items ?? []).map((item) => [item.id, item.quantity])
      )
  )
  const [error, setError] = useState<string | null>(null)

  const sortedItems = useMemo(
    () =>
      [...(cart.items ?? [])].sort((a, b) =>
        (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
      ),
    [cart.items]
  )

  const dirtyLineIds = sortedItems
    .filter((item) => draftQuantities[item.id] !== item.quantity)
    .map((item) => item.id)
  const hasInvalidQuantity = sortedItems.some((item) => {
    const quantity = draftQuantities[item.id]
    return !Number.isInteger(quantity) || quantity < 1 || quantity > 99
  })
  const hasDirtyQuantities = dirtyLineIds.length > 0

  const setDraftQuantity = (lineId: string, quantity: number) => {
    setError(null)
    setDraftQuantities((current) => ({
      ...current,
      [lineId]: Math.min(Math.max(quantity, 1), 99),
    }))
  }

  const updateCart = () => {
    if (!hasDirtyQuantities || hasInvalidQuantity) {
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        for (const item of sortedItems) {
          const nextQuantity = draftQuantities[item.id]
          if (nextQuantity !== item.quantity) {
            await updateLineItem({
              lineId: item.id,
              quantity: nextQuantity,
            })
          }
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update cart.")
      }
    })
  }

  const applyCoupon = async (code: string) => {
    const existingCodes =
      cart.promotions
        ?.map((promotion) => promotion.code)
        .filter((code): code is string => Boolean(code)) ?? []

    await applyPromotions([...existingCodes, code])
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 gap-6 small:grid-cols-[minmax(0,1fr)_320px] medium:grid-cols-[minmax(0,1fr)_340px]">
      <section className="overflow-hidden rounded-md border border-gray-100 bg-white px-5 py-6 shadow-sm small:px-7">
        <div className="hidden grid-cols-[minmax(260px,1fr)_112px_132px_112px_56px] items-center gap-x-3 border-b border-gray-100 px-1 pb-5 text-[12px] font-bold uppercase tracking-[0.01em] text-[#2c3038] small:grid medium:grid-cols-[minmax(300px,1fr)_124px_140px_124px_60px]">
          <span>Product</span>
          <span className="text-center">Unit Price</span>
          <span className="text-center">Quantity</span>
          <span className="text-center">Subtotal</span>
          <span className="text-center">Action</span>
        </div>

        <div>
          {sortedItems.map((item) => (
            <CartLineItemRow
              key={item.id}
              item={item}
              currencyCode={cart.currency_code}
              draftQuantity={draftQuantities[item.id] ?? item.quantity}
              onQuantityChange={(quantity) => setDraftQuantity(item.id, quantity)}
              onDeleted={() => router.refresh()}
              disabled={isPending}
            />
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-100 pt-5 medium:flex-row medium:items-start medium:justify-between">
          <CartCouponForm
            promotions={cart.promotions ?? []}
            onApply={applyCoupon}
          />
          <div className="flex flex-col gap-2 small:flex-row">
            <button
              type="button"
              onClick={updateCart}
              disabled={!hasDirtyQuantities || hasInvalidQuantity || isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gray-200 px-5 text-[14px] font-medium text-[#333740] transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="update-cart-button"
            >
              <ArrowPath className={isPending ? "animate-spin" : ""} />
              {isPending ? "Updating" : "Update Cart"}
            </button>
            <LocalizedClientLink
              href="/store"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gray-200 px-5 text-[14px] font-medium text-[#333740] transition hover:border-gray-300 hover:text-brand"
            >
              <ArrowLeft />
              Continue Shopping
            </LocalizedClientLink>
          </div>
        </div>
        {error && (
          <p
            className="mt-4 text-small-regular text-red-600"
            data-testid="cart-update-error"
          >
            {error}
          </p>
        )}
      </section>

      <aside className="flex flex-col gap-4">
        <CartSummaryPanel
          cart={cart}
          hasDirtyQuantities={hasDirtyQuantities}
          isUpdating={isPending}
        />
        <CartTrustPanel />
      </aside>
    </div>
  )
}
