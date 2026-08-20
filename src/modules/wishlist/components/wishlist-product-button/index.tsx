"use client"

import {
  addFeaturedProductToWishlist,
  removeProductFromWishlist,
} from "@lib/data/wishlist"
import { notify } from "@lib/notifications"
import { notifyWishlistCountUpdated } from "@lib/util/wishlist-count-event"
import { HeartIcon } from "@modules/layout/components/cba-icons"
import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react"

type WishlistProductContextValue = {
  productIds: Set<string>
  addProductId: (productId: string) => void
  removeProductId: (productId: string) => void
}

type WishlistProductButtonVariant = "card" | "best-selling" | "pdp"

type WishlistProductButtonProps = {
  productId?: string | null
  variantId?: string | null
  productTitle: string
  toastId: string
  disabled?: boolean
  variant?: WishlistProductButtonVariant
  iconSize?: number
  strokeWidth?: number
  iconClassName?: string
  className?: string
  children?: ReactNode
  onResult?: (result: { success: boolean; message: string }) => void
}

const WishlistProductContext = createContext<WishlistProductContextValue | null>(
  null
)

export function WishlistProductProvider({
  initialProductIds,
  children,
}: {
  initialProductIds: string[]
  children: ReactNode
}) {
  const [productIds, setProductIds] = useState(
    () => new Set(initialProductIds.filter(Boolean))
  )

  const value = useMemo<WishlistProductContextValue>(
    () => ({
      productIds,
      addProductId: (productId) => {
        setProductIds((current) => {
          if (current.has(productId)) {
            return current
          }
          const next = new Set(current)
          next.add(productId)
          return next
        })
      },
      removeProductId: (productId) => {
        setProductIds((current) => {
          if (!current.has(productId)) {
            return current
          }
          const next = new Set(current)
          next.delete(productId)
          return next
        })
      },
    }),
    [productIds]
  )

  return (
    <WishlistProductContext.Provider value={value}>
      {children}
    </WishlistProductContext.Provider>
  )
}

export function useWishlistProduct(productId?: string | null) {
  const context = useContext(WishlistProductContext)
  const normalizedProductId = productId ?? ""
  return {
    isWishlisted: Boolean(
      normalizedProductId && context?.productIds.has(normalizedProductId)
    ),
    addWishlistedProduct: () => {
      if (normalizedProductId) {
        context?.addProductId(normalizedProductId)
      }
    },
    removeWishlistedProduct: () => {
      if (normalizedProductId) {
        context?.removeProductId(normalizedProductId)
      }
    },
  }
}

export function WishlistProductButton({
  productId,
  variantId,
  productTitle,
  toastId,
  disabled = false,
  variant = "card",
  iconSize,
  strokeWidth,
  iconClassName,
  className,
  children,
  onResult,
}: WishlistProductButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const {
    isWishlisted,
    addWishlistedProduct,
    removeWishlistedProduct,
  } = useWishlistProduct(productId)
  const isUnavailable = disabled || isPending || !productId || !variantId
  const label = isWishlisted
    ? `Remove ${productTitle} from wishlist`
    : `Add ${productTitle} to wishlist`

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (!productId || !variantId) {
      notify.error("Please select a valid product.")
      return
    }

    if (isPending) {
      return
    }

    notify.loading(
      isWishlisted
        ? "Removing item from wishlist..."
        : "Adding item to wishlist...",
      { id: toastId }
    )
    setIsPending(true)

    try {
      if (isWishlisted) {
        const result = await removeProductFromWishlist({
          productId,
          variantId,
        })

        if (result.success) {
          removeWishlistedProduct()
          notifyWishlistCountUpdated(result.wishlistCount)
          onResult?.({ success: true, message: result.message })
          if (result.status === "not_present") {
            notify.info(result.message, { id: toastId })
          } else {
            notify.success(result.message, { id: toastId })
          }
        } else {
          onResult?.({ success: false, message: result.message })
          notify.error(result.message, "Could not remove this item from wishlist.", {
            id: toastId,
          })
        }
        return
      }

      const result = await addFeaturedProductToWishlist({
        productId,
        variantId,
      })

      if (result.success) {
        addWishlistedProduct()
        notifyWishlistCountUpdated(result.wishlistCount)
        onResult?.({ success: true, message: result.message })
        if (result.status === "already_present") {
          notify.info(result.message, { id: toastId })
        } else {
          notify.success(result.message, { id: toastId })
        }
      } else {
        onResult?.({ success: false, message: result.message })
        notify.error(result.message, "Could not add this item to wishlist.", {
          id: toastId,
        })
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isWishlisted}
      title={label}
      onClick={handleClick}
      disabled={isUnavailable}
      className={className ?? defaultClassName(variant)}
    >
      <HeartIcon
        size={iconSize ?? defaultIconSize(variant)}
        strokeWidth={strokeWidth ?? defaultStrokeWidth(variant)}
        fill={isWishlisted ? "currentColor" : "none"}
        className={isWishlisted ? "text-brand" : iconClassName}
      />
      {children}
    </button>
  )
}

function defaultClassName(variant: WishlistProductButtonVariant) {
  if (variant === "pdp") {
    return "flex items-center gap-2 hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
  }
  if (variant === "best-selling") {
    return "absolute flex items-center justify-center rounded-full bg-white text-[#ff3b30] shadow-[0_10px_22px_rgba(0,0,0,0.16)] transition-colors hover:bg-[#fff3f0] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
  }
  return "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#ff3b30] shadow-sm transition-colors hover:bg-[#fff3f0] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:w-9"
}

function defaultIconSize(variant: WishlistProductButtonVariant) {
  if (variant === "pdp") {
    return 15
  }
  if (variant === "best-selling") {
    return 16
  }
  return 17
}

function defaultStrokeWidth(variant: WishlistProductButtonVariant) {
  if (variant === "best-selling") {
    return 1.7
  }
  if (variant === "card") {
    return 1.8
  }
  return 1.8
}
