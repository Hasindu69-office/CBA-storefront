"use client"

import { addBundleToCart } from "@lib/data/cart"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import { addProductsToWishlist } from "@lib/data/wishlist"
import { notify } from "@lib/notifications"
import { openSideCart } from "@lib/util/side-cart-event"
import { notifyWishlistCountUpdated } from "@lib/util/wishlist-count-event"
import BundleOfferPanel from "@modules/products/components/bundle-offer/bundle-offer-panel"
import {
  buildSelectedItems,
  calculateBundleTotal,
  createInitialSelection,
} from "@modules/products/components/bundle-offer/utils"
import { HttpTypes } from "@medusajs/types"
import { useMemo, useState, useTransition } from "react"

type FrequentlyBoughtTogetherProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  title?: string
  mainImage?: string | null
  mainPrice: number | null
  currencyCode: string
  mainVariantId?: string
  mainPurchasable: boolean
  mainValid: boolean
  quantity: number
  companions: FeaturedProductCard[]
  onActionMessage?: (state: { type: "success" | "error"; message: string }) => void
}

export default function FrequentlyBoughtTogether({
  product,
  countryCode,
  title = "Frequently Bought Together",
  mainImage,
  mainPrice,
  currencyCode,
  mainVariantId,
  mainPurchasable,
  mainValid,
  quantity,
  companions,
  onActionMessage,
}: FrequentlyBoughtTogetherProps) {
  const [selection, setSelection] = useState(() => createInitialSelection(companions))
  const [isPending, startTransition] = useTransition()

  const selectedItems = useMemo(
    () =>
      buildSelectedItems({
        selection,
        productId: product.id,
        mainVariantId,
        mainPurchasable,
        mainValid,
        quantity,
        companions,
      }),
    [
      selection,
      product.id,
      mainVariantId,
      mainPurchasable,
      mainValid,
      quantity,
      companions,
    ]
  )

  const total = useMemo(
    () =>
      calculateBundleTotal({
        selection,
        mainPrice,
        mainPurchasable,
        quantity,
        companions,
      }),
    [selection, mainPrice, mainPurchasable, quantity, companions]
  )

  function submitAddToCart() {
    if (!selectedItems.length) {
      notify.error("Select at least one available product.")
      onActionMessage?.({
        type: "error",
        message: "Select at least one available product.",
      })
      return
    }

    if (selection.includeMain && (!mainValid || !mainPurchasable)) {
      notify.error("Select a valid in-stock option for this item.")
      onActionMessage?.({
        type: "error",
        message: "Select a valid in-stock option for this item.",
      })
      return
    }

    openSideCart({ pendingMessage: "Adding bundle to cart.", refresh: false })
    startTransition(async () => {
      const toastId = "bundle-add-to-cart"
      notify.loading("Adding bundle to cart...", { id: toastId })
      try {
        const cart = await addBundleToCart({
          items: selectedItems,
          countryCode,
        })
        onActionMessage?.({
          type: "success",
          message: "Bundle added to cart.",
        })
        openSideCart({ cart, refresh: true })
        notify.success("Bundle added to cart.", { id: toastId })
      } catch (error) {
        openSideCart({ pendingMessage: null, refresh: false })
        notify.error(error, "Could not add bundle.", { id: toastId })
        onActionMessage?.({
          type: "error",
          message:
            error instanceof Error ? error.message : "Could not add bundle.",
        })
      }
    })
  }

  function submitWishlist() {
    if (!selectedItems.length) {
      notify.error("Select at least one available product.")
      onActionMessage?.({
        type: "error",
        message: "Select at least one available product.",
      })
      return
    }

    startTransition(async () => {
      const toastId = "bundle-add-to-wishlist"
      notify.loading("Adding products to wishlist...", { id: toastId })
      const result = await addProductsToWishlist(
        selectedItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
        }))
      )
      onActionMessage?.({
        type: result.success ? "success" : "error",
          message: result.message,
        })
      if (result.success) {
        if (result.wishlistCount !== undefined) {
          notifyWishlistCountUpdated(result.wishlistCount)
        }
        if (result.addedCount === 0 && result.alreadyPresentCount > 0) {
          notify.info(result.message, { id: toastId })
        } else {
          notify.success(result.message, { id: toastId })
        }
      } else {
        notify.error(result.message, "Could not add selected products to wishlist.", {
          id: toastId,
        })
      }
    })
  }

  if (!companions.length) {
    return null
  }

  return (
    <div className="rounded-rounded border border-gray-200 p-7">
      <h2 className="text-lg font-black uppercase">{title}</h2>
      <BundleOfferPanel
        product={product}
        companions={companions}
        mainImage={mainImage}
        mainPrice={mainPrice}
        currencyCode={currencyCode}
        mainPurchasable={mainPurchasable}
        mainValid={mainValid}
        selection={selection}
        setSelection={setSelection}
        total={total}
        selectedItemsCount={selectedItems.length}
        isPending={isPending}
        onAddToCart={submitAddToCart}
        onAddToWishlist={submitWishlist}
      />
    </div>
  )
}
