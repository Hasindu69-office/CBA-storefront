"use client"

import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import { useState, useTransition } from "react"
import { applyPromotionsSafe } from "@lib/data/cart"
import { notify } from "@lib/notifications"
import { useRouter } from "next/navigation"
import {
  hasAutomaticPromotions,
  listAllPromotionCodes,
  listManualPromotionCodes,
  manualCodesWithoutCoupon,
} from "@lib/util/coupon-promotions"
import {
  PROMOTION_CODE_MAX_COUNT,
  PROMOTION_CODE_MAX_LENGTH,
  validatePromotionCode,
} from "@lib/util/promotions"

type CartCouponFormVariant = "cart" | "checkout"

type CartCouponFormProps = {
  promotions: HttpTypes.StorePromotion[]
  onApply: (code: string) => Promise<string | null>
  disabled?: boolean
  variant?: CartCouponFormVariant
  className?: string
}

const variantConfig: Record<
  CartCouponFormVariant,
  { inputId: string; testIdPrefix: string; wrapperClass: string }
> = {
  cart: {
    inputId: "cart-coupon-code",
    testIdPrefix: "",
    wrapperClass: "w-full max-w-[430px]",
  },
  checkout: {
    inputId: "checkout-coupon-code",
    testIdPrefix: "checkout-",
    wrapperClass: "w-full",
  },
}

function testId(prefix: string, name: string) {
  return prefix ? `${prefix}${name}` : name
}

export default function CartCouponForm({
  promotions,
  onApply,
  disabled = false,
  variant = "cart",
  className,
}: CartCouponFormProps) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const config = variantConfig[variant]
  const promotionCodes = listAllPromotionCodes(promotions)
  const manualPromotionCodes = listManualPromotionCodes(promotions)
  const automaticPromotions = hasAutomaticPromotions(promotions)
  const isDisabled = disabled || isPending

  const applyCode = () => {
    if (disabled) {
      return
    }

    const result = validatePromotionCode(code, promotionCodes)
    const normalizedCode = result.code
    setError(null)

    if (result.error) {
      setError(result.error)
      return
    }

    if (manualPromotionCodes.length >= PROMOTION_CODE_MAX_COUNT) {
      setError(`You can apply up to ${PROMOTION_CODE_MAX_COUNT} coupon codes.`)
      return
    }

    startTransition(async () => {
      const toastId = `${variant}-coupon:${normalizedCode}`
      notify.loading("Applying coupon...", { id: toastId })
      try {
        const applyError = await onApply(normalizedCode)
        if (applyError) {
          setError(applyError)
          notify.error(applyError, "Could not apply coupon.", { id: toastId })
          return
        }
        setCode("")
        notify.success("Coupon applied.", { id: toastId })
      } catch (err) {
        notify.error(err, "Could not apply coupon.", { id: toastId })
        setError(err instanceof Error ? err.message : "Could not apply coupon.")
      }
    })
  }

  const removeCode = (removedCode: string) => {
    if (disabled) {
      return
    }

    setError(null)
    startTransition(async () => {
      const toastId = `${variant}-coupon-remove:${removedCode}`
      notify.loading("Removing coupon...", { id: toastId })
      try {
        const result = await applyPromotionsSafe(
          manualCodesWithoutCoupon(promotions, removedCode)
        )
        if (!result.success) {
          setError(result.error)
          notify.error(result.error, "Could not remove coupon.", { id: toastId })
          return
        }
        router.refresh()
        notify.success("Coupon removed.", { id: toastId })
      } catch (err) {
        notify.error(err, "Could not remove coupon.", { id: toastId })
        setError(err instanceof Error ? err.message : "Could not remove coupon.")
      }
    })
  }

  return (
    <div className={className ?? config.wrapperClass}>
      <div className="mb-2">
        <p className="text-[14px] font-semibold text-[#111827]">Coupon code</p>
        <p className="mt-0.5 text-[12px] text-[#7a8190]">
          Have a coupon? Enter it here. Store offers are applied automatically
          when eligible. Order-level coupons may replace an active store offer.
        </p>
      </div>
      <div className="flex h-12 overflow-hidden rounded-md border border-gray-200 bg-white shadow-[0_2px_8px_rgba(17,24,39,0.04)] focus-within:border-brand">
        <label className="sr-only" htmlFor={config.inputId}>
          Coupon code
        </label>
        <input
          id={config.inputId}
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              applyCode()
            }
          }}
          maxLength={PROMOTION_CODE_MAX_LENGTH}
          placeholder="Enter coupon code"
          disabled={isDisabled}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 border-0 px-4 text-[14px] outline-none placeholder:text-[#a4a9b6] disabled:cursor-not-allowed disabled:bg-gray-50"
          data-testid={testId(config.testIdPrefix, "discount-input")}
        />
        <button
          type="button"
          onClick={applyCode}
          disabled={isDisabled}
          className="border-l border-gray-200 bg-[#fff7f1] px-5 text-[14px] font-semibold text-brand transition hover:bg-[#fff0e5] hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          data-testid={testId(config.testIdPrefix, "discount-apply-button")}
        >
          {isPending ? "Applying" : "Apply"}
        </button>
      </div>
      {(manualPromotionCodes.length > 0 || automaticPromotions) && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Applied promotions">
          {manualPromotionCodes.map((promotionCode) => (
            <button
              key={promotionCode}
              type="button"
              onClick={() => removeCode(promotionCode)}
              disabled={isDisabled}
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-brand/25 bg-[#fff7f1] px-3 py-1.5 text-[12px] font-semibold text-[#333740] hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
              data-testid={testId(config.testIdPrefix, "remove-discount-button")}
              aria-label={`Remove coupon ${promotionCode}`}
            >
              {promotionCode}
              <Trash size={14} />
            </button>
          ))}
          {automaticPromotions && (
            <span
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700"
              title="Automatic offers are applied by the store when your cart is eligible."
            >
              Store discount applied
              <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700">
                Auto
              </span>
            </span>
          )}
        </div>
      )}
      {error && (
        <p
          className="mt-2 text-small-regular text-red-600"
          data-testid={testId(config.testIdPrefix, "discount-error-message")}
          role="status"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}
