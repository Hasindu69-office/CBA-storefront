"use client"

import { addBundleToCart } from "@lib/data/cart"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import { addProductsToWishlist } from "@lib/data/wishlist"
import { notify } from "@lib/notifications"
import { openSideCart } from "@lib/util/side-cart-event"
import BundleOfferPanel from "@modules/products/components/bundle-offer/bundle-offer-panel"
import {
  BUNDLE_CATEGORIES,
  buildSelectedItems,
  calculateBundleTotal,
  createInitialSelection,
  type BundleCategory,
  type BundleCategoryKey,
  type BundleSelection,
} from "@modules/products/components/bundle-offer/utils"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useMemo, useState, useTransition } from "react"

type ProductCompanionZoneProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  mainImage?: string | null
  mainPrice: number | null
  currencyCode: string
  mainVariantId?: string
  mainPurchasable: boolean
  mainValid: boolean
  quantity: number
  crossSellProducts: FeaturedProductCard[]
  accessoryProducts: FeaturedProductCard[]
  upSellProducts: FeaturedProductCard[]
  onActionMessage?: (state: { type: "success" | "error"; message: string }) => void
}

export default function ProductCompanionZone({
  product,
  countryCode,
  mainImage,
  mainPrice,
  currencyCode,
  mainVariantId,
  mainPurchasable,
  mainValid,
  quantity,
  crossSellProducts,
  accessoryProducts,
  upSellProducts,
  onActionMessage,
}: ProductCompanionZoneProps) {
  const categories = useMemo(
    () =>
      BUNDLE_CATEGORIES.map((category) => ({
        ...category,
        companions:
          category.key === "cross_sell"
            ? crossSellProducts
            : category.key === "accessory"
              ? accessoryProducts
              : upSellProducts,
      })).filter((category) => category.companions.length > 0),
    [accessoryProducts, crossSellProducts, upSellProducts]
  )

  const [activeKey, setActiveKey] = useState<BundleCategoryKey>(
    categories[0]?.key ?? "cross_sell"
  )
  const [selections, setSelections] = useState<
    Partial<Record<BundleCategoryKey, BundleSelection>>
  >(() => buildInitialSelections(categories))
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!categories.length) {
      return
    }

    if (!categories.some((category) => category.key === activeKey)) {
      setActiveKey(categories[0].key)
    }

    setSelections((current) => {
      const next = { ...current }
      for (const category of categories) {
        if (!next[category.key]) {
          next[category.key] = createInitialSelection(category.companions)
        }
      }
      return next
    })
  }, [activeKey, categories])

  const activeCategory = categories.find((category) => category.key === activeKey)

  if (!activeCategory) {
    return null
  }

  const activeCategoryKey = activeCategory.key
  const selection =
    selections[activeCategoryKey] ?? createInitialSelection(activeCategory.companions)

  const selectedItems = buildSelectedItems({
    selection,
    productId: product.id,
    mainVariantId,
    mainPurchasable,
    mainValid,
    quantity,
    companions: activeCategory.companions,
  })

  const total = calculateBundleTotal({
    selection,
    mainPrice,
    mainPurchasable,
    quantity,
    companions: activeCategory.companions,
  })

  function updateSelection(
    updater: BundleSelection | ((current: BundleSelection) => BundleSelection)
  ) {
    const categoryKey = activeKey
    const categoryCompanions =
      categories.find((category) => category.key === categoryKey)?.companions ?? []

    setSelections((current) => {
      const previous =
        current[categoryKey] ?? createInitialSelection(categoryCompanions)
      const nextSelection =
        typeof updater === "function" ? updater(previous) : updater

      return {
        ...current,
        [categoryKey]: nextSelection,
      }
    })
  }

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
      const toastId = `companion-bundle:${activeCategoryKey}`
      notify.loading("Adding bundle to cart...", { id: toastId })
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
      const toastId = `companion-wishlist:${activeCategoryKey}`
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

  return (
    <div className="rounded-rounded border border-gray-200 p-7">
      {categories.length > 1 ? (
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Companion product categories"
        >
          {categories.map((category) => {
            const isActive = category.key === activeCategory.key
            return (
              <button
                key={category.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveKey(category.key)}
                className={
                  isActive
                    ? "rounded-full border border-brand bg-brand px-4 py-2 text-xs font-bold uppercase text-white"
                    : "rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold uppercase text-gray-600 hover:border-brand hover:text-brand"
                }
              >
                {category.title}
              </button>
            )
          })}
        </div>
      ) : (
        <h2 className="text-lg font-black uppercase">{activeCategory.title}</h2>
      )}

      <div role="tabpanel" aria-label={activeCategory.title}>
        <BundleOfferPanel
          product={product}
          companions={activeCategory.companions}
          mainImage={mainImage}
          mainPrice={mainPrice}
          currencyCode={currencyCode}
          mainPurchasable={mainPurchasable}
          mainValid={mainValid}
          selection={selection}
          setSelection={updateSelection}
          total={total}
          selectedItemsCount={selectedItems.length}
          isPending={isPending}
          onAddToCart={submitAddToCart}
          onAddToWishlist={submitWishlist}
        />
      </div>
    </div>
  )
}

function buildInitialSelections(categories: BundleCategory[]) {
  return Object.fromEntries(
    categories.map((category) => [
      category.key,
      createInitialSelection(category.companions),
    ])
  ) as Partial<Record<BundleCategoryKey, BundleSelection>>
}
