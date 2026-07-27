"use client"

import type { FeaturedProductCard } from "@lib/data/featured-products"
import { convertToLocale } from "@lib/util/money"
import { HeartIcon } from "@modules/layout/components/cba-icons"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"

import type { BundleSelection } from "./utils"
import { isCompanionPurchasable } from "./utils"

type BundleOfferPanelProps = {
  product: HttpTypes.StoreProduct
  companions: FeaturedProductCard[]
  mainImage?: string | null
  mainPrice: number | null
  currencyCode: string
  mainPurchasable: boolean
  mainValid: boolean
  selection: BundleSelection
  setSelection: Dispatch<SetStateAction<BundleSelection>>
  total: number
  selectedItemsCount: number
  isPending: boolean
  onAddToCart: () => void
  onAddToWishlist: () => void
}

export default function BundleOfferPanel({
  product,
  companions,
  mainImage,
  mainPrice,
  currencyCode,
  mainPurchasable,
  mainValid,
  selection,
  setSelection,
  total,
  selectedItemsCount,
  isPending,
  onAddToCart,
  onAddToWishlist,
}: BundleOfferPanelProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  function updateScrollState() {
    const scroller = scrollerRef.current
    if (!scroller) {
      setCanScrollPrev(false)
      setCanScrollNext(false)
      return
    }

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    setCanScrollPrev(scroller.scrollLeft > 8)
    setCanScrollNext(scroller.scrollLeft < maxScrollLeft - 8)
  }

  useEffect(() => {
    updateScrollState()
    const scroller = scrollerRef.current
    if (!scroller) {
      return
    }

    scroller.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)

    return () => {
      scroller.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [companions.length, mainImage])

  function scrollImages(direction: "prev" | "next") {
    const scroller = scrollerRef.current
    if (!scroller) {
      return
    }

    const distance = Math.max(scroller.clientWidth * 0.75, 160)
    scroller.scrollBy({
      left: direction === "next" ? distance : -distance,
      behavior: "smooth",
    })
  }

  const canSubmit = selectedItemsCount > 0 && !isPending

  return (
    <div className="mt-7 grid gap-8 small:grid-cols-[1fr_280px]">
      <div>
        <div className="relative">
          {canScrollPrev && (
            <button
              type="button"
              aria-label="Scroll bundle products left"
              onClick={() => scrollImages("prev")}
              className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-circle border border-gray-200 bg-white text-lg font-bold text-gray-700 shadow-sm hover:border-brand hover:text-brand small:flex"
            >
              ‹
            </button>
          )}
          {canScrollNext && (
            <button
              type="button"
              aria-label="Scroll bundle products right"
              onClick={() => scrollImages("next")}
              className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-circle border border-gray-200 bg-white text-lg font-bold text-gray-700 shadow-sm hover:border-brand hover:text-brand small:flex"
            >
              ›
            </button>
          )}

          <div
            ref={scrollerRef}
            className="no-scrollbar flex items-center gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1"
          >
            <div className="flex shrink-0 snap-start items-center gap-5">
              <BundleProductImage
                title={product.title ?? "This item"}
                image={mainImage}
              />
            </div>
            {companions.map((item) => (
              <div key={item.id} className="flex shrink-0 snap-start items-center gap-5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-circle bg-gray-100 text-lg font-bold">
                  +
                </span>
                <BundleProductImage title={item.title} image={item.thumbnail?.url} />
              </div>
            ))}
          </div>
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
        {!selectedItemsCount && (
          <p className="mt-2 text-sm text-gray-500">
            Select at least one available product.
          </p>
        )}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!canSubmit}
          className="mt-5 h-12 w-full rounded-base border border-brand text-xs font-bold uppercase text-brand hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to cart
        </button>
        <button
          type="button"
          onClick={onAddToWishlist}
          disabled={!canSubmit}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <HeartIcon className="h-4 w-4" />
          Add all to Wishlist
        </button>
      </div>
    </div>
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
    <div className="relative h-32 w-32 shrink-0 rounded-base bg-gray-50">
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
