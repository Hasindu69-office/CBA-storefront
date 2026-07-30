"use client"

import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import { useState, useTransition } from "react"
import { applyPromotions } from "@lib/data/cart"
import { notify } from "@lib/notifications"
import { useRouter } from "next/navigation"

type CartCouponFormProps = {
  promotions: HttpTypes.StorePromotion[]
  onApply: (code: string) => Promise<void>
}

const safeCode = /^[A-Z0-9][A-Z0-9_-]{0,63}$/

export default function CartCouponForm({
  promotions,
  onApply,
}: CartCouponFormProps) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const promotionCodes = promotions
    .map((promotion) => promotion.code)
    .filter((code): code is string => Boolean(code))

  const applyCode = () => {
    const normalizedCode = code.trim().toUpperCase()
    setError(null)

    if (!normalizedCode) {
      setError("Enter a coupon code.")
      return
    }

    if (!safeCode.test(normalizedCode)) {
      setError("Coupon code can use letters, numbers, hyphens, and underscores.")
      return
    }

    if (promotionCodes.includes(normalizedCode)) {
      setError("Coupon code is already applied.")
      return
    }

    startTransition(async () => {
      const toastId = `cart-coupon:${normalizedCode}`
      notify.loading("Applying coupon...", { id: toastId })
      try {
        await onApply(normalizedCode)
        setCode("")
        notify.success("Coupon applied.", { id: toastId })
      } catch (err) {
        notify.error(err, "Could not apply coupon.", { id: toastId })
        setError(err instanceof Error ? err.message : "Could not apply coupon.")
      }
    })
  }

  const removeCode = (removedCode: string) => {
    setError(null)
    startTransition(async () => {
      const toastId = `cart-coupon-remove:${removedCode}`
      notify.loading("Removing coupon...", { id: toastId })
      try {
        await applyPromotions(
          promotionCodes.filter((promotionCode) => promotionCode !== removedCode)
        )
        router.refresh()
        notify.success("Coupon removed.", { id: toastId })
      } catch (err) {
        notify.error(err, "Could not remove coupon.", { id: toastId })
        setError(err instanceof Error ? err.message : "Could not remove coupon.")
      }
    })
  }

  return (
    <div className="w-full max-w-[360px]">
      <div className="flex h-11 overflow-hidden rounded-md border border-gray-200 bg-white">
        <label className="sr-only" htmlFor="cart-coupon-code">
          Coupon code
        </label>
        <input
          id="cart-coupon-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              applyCode()
            }
          }}
          maxLength={64}
          placeholder="Enter coupon code"
          className="min-w-0 flex-1 border-0 px-4 text-[14px] outline-none placeholder:text-[#a4a9b6]"
          data-testid="discount-input"
        />
        <button
          type="button"
          onClick={applyCode}
          disabled={isPending}
          className="border-l border-gray-200 px-5 text-[14px] font-semibold text-brand transition hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="discount-apply-button"
        >
          {isPending ? "Applying" : "Apply"}
        </button>
      </div>
      {promotionCodes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {promotionCodes.map((promotionCode) => (
            <button
              key={promotionCode}
              type="button"
              onClick={() => removeCode(promotionCode)}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-[12px] font-semibold text-[#333740] hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="remove-discount-button"
            >
              {promotionCode}
              <Trash size={14} />
            </button>
          ))}
        </div>
      )}
      {error && (
        <p
          className="mt-2 text-small-regular text-red-600"
          data-testid="discount-error-message"
        >
          {error}
        </p>
      )}
    </div>
  )
}
