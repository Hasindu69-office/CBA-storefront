"use client"

import { addBundleToCart } from "@lib/data/cart"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import { addProductsToWishlist } from "@lib/data/wishlist"
import { convertToLocale } from "@lib/util/money"
import { HeartIcon } from "@modules/layout/components/cba-icons"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
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

type BundleSelection = {
  includeMain: boolean
  companions: Record<string, boolean>
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
  const [selection, setSelection] = useState<BundleSelection>(() => ({
    includeMain: true,
    companions: Object.fromEntries(
      companions.map((item) => [item.id, isCompanionPurchasable(item)])
    ),
  }))
  const [isPending, startTransition] = useTransition()

  const selectedCompanions = useMemo(
    () =>
      companions.filter(
        (item) => selection.companions[item.id] && isCompanionPurchasable(item)
      ),
    [companions, selection.companions]
  )

  const total = useMemo(() => {
    let sum = 0
    if (selection.includeMain && mainPurchasable && mainPrice !== null) {
      sum += mainPrice * quantity
    }
    for (const item of selectedCompanions) {
      sum += item.price.calculated_amount ?? 0
    }
    return sum
  }, [
    selection.includeMain,
    mainPurchasable,
    mainPrice,
    quantity,
    selectedCompanions,
  ])

  const selectedItems = useMemo(() => {
    const items: Array<{ productId: string; variantId: string; quantity: number }> =
      []

    if (selection.includeMain && mainVariantId && mainPurchasable && mainValid) {
      items.push({
        productId: product.id,
        variantId: mainVariantId,
        quantity,
      })
    }

    for (const item of selectedCompanions) {
      if (item.default_variant?.id) {
        items.push({
          productId: item.product_id,
          variantId: item.default_variant.id,
          quantity: 1,
        })
      }
    }

    return items
  }, [
    selection.includeMain,
    mainVariantId,
    mainPurchasable,
    mainValid,
    product.id,
    quantity,
    selectedCompanions,
  ])

  const canSubmit = selectedItems.length > 0 && !isPending

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
      } catch (error) {
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

        <div className="mt-7 grid gap-8 small:grid-cols-[1fr_280px]">
          <div>
            <div className="flex flex-wrap items-center gap-5">
              <BundleProductImage title={product.title ?? "This item"} image={mainImage} />
              {companions.map((item) => (
                <div key={item.id} className="flex items-center gap-5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-circle bg-gray-100 text-lg font-bold">
                    +
                  </span>
                  <BundleProductImage
                    title={item.title}
                    image={item.thumbnail?.url}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 text-sm">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selection.includeMain}
                  disabled={!mainPurchasable || !mainValid}
                  onChange={(event) =>
                    setSelection((current) => ({
                      ...current,
                      includeMain: event.target.checked,
                    }))
                  }
                />
                <span>
                  <span className="font-semibold">This item:</span> {product.title}{" "}
                  {mainPrice !== null && (
                    <strong className="text-brand">
                      {convertToLocale({
                        amount: mainPrice,
                        currency_code: currencyCode,
                      })}
                    </strong>
                  )}
                </span>
              </label>

              {companions.map((item) => {
                const purchasable = isCompanionPurchasable(item)
                return (
                  <label key={item.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={Boolean(selection.companions[item.id])}
                      disabled={!purchasable}
                      onChange={(event) =>
                        setSelection((current) => ({
                          ...current,
                          companions: {
                            ...current.companions,
                            [item.id]: event.target.checked,
                          },
                        }))
                      }
                    />
                    <span className={!purchasable ? "text-gray-400" : undefined}>
                      {item.title}{" "}
                      {item.price.calculated_amount !== null && (
                        <strong className="text-brand">
                          {convertToLocale({
                            amount: item.price.calculated_amount,
                            currency_code: item.price.currency_code,
                          })}
                        </strong>
                      )}
                      {!purchasable && (
                        <span className="ml-2 text-xs uppercase text-gray-400">
                          Unavailable
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex h-fit flex-col">
            <p className="text-xs font-bold uppercase text-gray-500">Total Price</p>
            <p className="mt-2 text-3xl font-black">
              {convertToLocale({ amount: total, currency_code: currencyCode })}
            </p>
            {!selectedItems.length && (
              <p className="mt-2 text-sm text-gray-500">
                Select at least one available product.
              </p>
            )}
            <button
              type="button"
              onClick={submitAddToCart}
              disabled={!canSubmit}
              className="mt-5 h-12 w-full rounded-base border border-brand text-xs font-bold uppercase text-brand hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to cart
            </button>
            <button
              type="button"
              onClick={submitWishlist}
              disabled={!canSubmit}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HeartIcon className="h-4 w-4" />
              Add all to Wishlist
            </button>
          </div>
        </div>
    </div>
  )
}

function isCompanionPurchasable(item: FeaturedProductCard) {
  return (
    Boolean(item.default_variant?.id) &&
    item.inventory.purchasable &&
    item.price.status === "available" &&
    item.price.calculated_amount !== null
  )
}

function BundleProductImage({
  title,
  image,
}: {
  title: string
  image?: string | null
}) {
  return (
    <div className="relative h-32 w-32 rounded-base bg-gray-50">
      {image ? (
        <Image
          src={image}
          alt={title}
          fill
          sizes="128px"
          className="object-contain p-3"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-gray-400">
          No image
        </div>
      )}
    </div>
  )
}
