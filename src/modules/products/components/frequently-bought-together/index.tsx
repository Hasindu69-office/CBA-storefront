"use client"

import { addBundleToCart } from "@lib/data/cart"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import { addProductsToWishlist } from "@lib/data/wishlist"
import { openSideCart } from "@lib/util/side-cart-event"
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
      onActionMessage?.({
        type: "error",
        message: "Select at least one available product.",
      })
      return
    }

    if (selection.includeMain && (!mainValid || !mainPurchasable)) {
      onActionMessage?.({
        type: "error",
        message: "Select a valid in-stock option for this item.",
      })
      return
    }

    openSideCart({ pendingMessage: "Adding bundle to cart.", refresh: false })
    startTransition(async () => {
      try {
        await addBundleToCart({
          items: selectedItems,
          countryCode,
        })
        onActionMessage?.({
          type: "success",
          message: "Bundle added to cart.",
        })
        openSideCart({ pendingMessage: "Updating cart.", refresh: true })
      } catch (error) {
        openSideCart({ pendingMessage: null, refresh: false })
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
      onActionMessage?.({
        type: "error",
        message: "Select at least one available product.",
      })
      return
    }

    startTransition(async () => {
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
