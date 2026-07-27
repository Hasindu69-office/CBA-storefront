"use client"

import { MouseEvent, useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"

import { addToCart } from "@lib/data/cart"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import { addFeaturedProductToWishlist } from "@lib/data/wishlist"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import {
  HeartIcon,
  ShoppingCartIcon,
} from "@modules/layout/components/cba-icons"

type BestSellingProductCardProps = {
  product: FeaturedProductCard
  priority: boolean
  variant?: "raised" | "flat"
}

const BestSellingProductCard = ({
  product,
  priority,
  variant = "raised",
}: BestSellingProductCardProps) => {
  const router = useRouter()
  const countryCode = useParams().countryCode as string
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  const isPurchasable =
    !!product.default_variant?.id &&
    product.inventory.purchasable &&
    product.price.status === "available"
  const displayBadges = product.badges
    .filter((badge) => !isFeaturedBadge(badge))
    .slice(0, 1)
  const sizeClassName =
    variant === "flat"
      ? "h-[374px] w-full max-w-[230px] flex-none small:h-[382px]"
      : "h-[374px] w-[220px] flex-none small:h-[382px] small:w-full small:max-w-[194px] medium:max-w-[200px] large:max-w-[218px]"

  const handleAddToCart = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!product.default_variant?.id) {
      setStatusMessage("Please select a valid product.")
      return
    }

    if (!isPurchasable) {
      setStatusMessage(inventoryLabel(product.inventory.status))
      return
    }

    setIsAddingToCart(true)
    setStatusMessage("")

    try {
      await addToCart({
        variantId: product.default_variant.id,
        quantity: 1,
        countryCode,
      })
      setStatusMessage("Added to cart.")
      router.refresh()
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Could not add to cart."
      )
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleAddToWishlist = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!product.default_variant?.id) {
      setStatusMessage("Please select a valid product.")
      return
    }

    setIsAddingToWishlist(true)
    setStatusMessage("")

    const result = await addFeaturedProductToWishlist({
      productId: product.product_id ?? product.id,
      variantId: product.default_variant.id,
    })

    setStatusMessage(result.message)
    setIsAddingToWishlist(false)
  }

  return (
    <article
      data-best-selling-product-card
      className={`group flex ${sizeClassName} snap-start flex-col overflow-hidden rounded-[8px] border border-[#ededed] bg-white transition-shadow ${
        variant === "flat"
          ? "shadow-none hover:shadow-none"
          : "shadow-[0_12px_28px_rgba(0,0,0,0.16)] hover:shadow-[0_0_24px_rgba(255,92,24,0.72)]"
      }`}
    >
      <div className="relative h-[154px] flex-shrink-0 overflow-hidden rounded-t-[8px] border-b border-[#f0f0f0] bg-white small:h-[158px] large:h-[168px]">
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="block h-full w-full"
          aria-label={`View ${product.title}`}
        >
          {product.thumbnail?.url ? (
            <Image
              src={product.thumbnail.url}
              alt={product.thumbnail.alt || product.title}
              fill
              priority={priority}
              sizes="220px"
              className="object-contain object-center p-4 transition-transform duration-300 group-hover:scale-[1.03] large:p-5"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PlaceholderImage size={34} />
            </div>
          )}
        </LocalizedClientLink>

        {!!displayBadges.length && (
          <div className="absolute left-2.5 top-2.5 max-w-[118px]">
            {displayBadges.map((badge) => (
              <span
                key={badge.key}
                className={`${badgeColorClassName(
                  badge
                )} block rounded-[5px] px-3 py-1.5 text-center text-[10px] font-bold uppercase leading-3 text-white`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          aria-label={`Add ${product.title} to wishlist`}
          title="Add to wishlist"
          onClick={handleAddToWishlist}
          disabled={isAddingToWishlist || !product.default_variant?.id}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#ff3b30] shadow-[0_10px_22px_rgba(0,0,0,0.16)] transition-colors hover:bg-[#fff3f0] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 large:h-9 large:w-9"
        >
          <HeartIcon size={18} strokeWidth={1.7} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-3.5 large:px-4 large:py-4">
        <div className="flex min-h-[22px] items-center gap-2.5">
          {product.brand?.logo_url ? (
            <span className="relative block h-5 w-[54px] flex-shrink-0">
              <Image
                src={product.brand.logo_url}
                alt={product.brand.logo_alt_text || `${product.brand.name} logo`}
                fill
                sizes="54px"
                className="object-contain object-left"
              />
            </span>
          ) : product.brand?.name ? (
            <span className="line-clamp-1 max-w-[68px] text-[11px] font-bold uppercase leading-4 text-black">
              {product.brand.name}
            </span>
          ) : null}
          {product.brand?.name && product.category?.name && (
            <span className="h-5 w-px flex-shrink-0 bg-[#d4d4d8]" />
          )}
          {product.category?.name && (
            <span className="line-clamp-1 text-[11px] leading-4 text-[#9ca3af]">
              {product.category.name}
            </span>
          )}
        </div>

        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="mt-2 block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <h3 className="line-clamp-2 min-h-[48px] text-[15px] font-bold leading-6 tracking-normal text-black large:text-[16px]">
            {product.title}
          </h3>
        </LocalizedClientLink>

        <div className="mt-2 flex min-h-[22px] items-center gap-2">
          <ProductRating rating={product.rating} />
        </div>

        <div
          className={`mt-1.5 line-clamp-1 text-[11px] leading-5 ${
            product.inventory.in_stock || product.inventory.allow_backorder
              ? "text-[#69be3b]"
              : "text-[#a1a1aa]"
          }`}
        >
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current" />
          {inventoryLabel(product.inventory.status)}
        </div>

        <div className="mt-auto -mx-3 flex min-h-[70px] items-center justify-between gap-3 border-t border-[#e5e7eb] px-3 pt-2.5 large:-mx-4 large:px-4">
          <ProductCardPrice product={product} />
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isPurchasable || isAddingToCart}
            aria-label={`Add ${product.title} to cart`}
            title={isAddingToCart ? "Adding to cart" : "Add to cart"}
            className="flex h-10 w-11 flex-shrink-0 items-center justify-center rounded-[10px] border border-brand bg-white text-brand transition-colors hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[#d4d4d8] disabled:text-[#a1a1aa] disabled:hover:bg-white large:h-11 large:w-[50px]"
          >
            <ShoppingCartIcon size={16} />
          </button>
        </div>

        <p
          aria-live="polite"
          className={`mt-1 min-h-[14px] text-[10px] leading-[14px] ${
            statusMessage.toLowerCase().includes("could not") ||
            statusMessage.toLowerCase().includes("invalid")
              ? "text-[#dc2626]"
              : "text-[#52525b]"
          }`}
        >
          {statusMessage}
        </p>
      </div>
    </article>
  )
}

const ProductRating = ({
  rating,
}: {
  rating: FeaturedProductCard["rating"]
}) => {
  if (!rating || rating.count < 1) {
    return (
      <span className="text-[12px] font-medium leading-5 text-[#8a8a8f]">
        No reviews
      </span>
    )
  }

  return (
    <span className="flex min-w-0 items-center gap-1 text-[12px] leading-5">
      <span className="text-[18px] leading-none text-brand" aria-hidden="true">
        ☆☆☆☆☆
      </span>
      <span className="font-bold text-black">{rating.average.toFixed(1)}</span>
      <span className="text-[#8a8a8f]">({rating.count})</span>
    </span>
  )
}

const ProductCardPrice = ({ product }: { product: FeaturedProductCard }) => {
  if (
    product.price.status !== "available" ||
    product.price.calculated_amount === null
  ) {
    return (
      <p className="min-w-0 flex-1 text-[13px] font-bold leading-5 text-black">
        Contact for price
      </p>
    )
  }

  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="whitespace-normal break-words text-[13px] font-bold leading-5 text-black">
        {convertToLocale({
          amount: product.price.calculated_amount,
          currency_code: product.price.currency_code,
          maximumFractionDigits: 2,
        })}
      </span>
      {product.price.has_discount && product.price.original_amount !== null && (
        <span className="truncate text-[11px] font-medium leading-4 text-[#8a8a8f] line-through">
          {convertToLocale({
            amount: product.price.original_amount,
            currency_code: product.price.currency_code,
            maximumFractionDigits: 2,
          })}
        </span>
      )}
    </span>
  )
}

function isFeaturedBadge(badge: FeaturedProductCard["badges"][number]) {
  return (
    badge.key.trim().toLowerCase() === "featured" ||
    badge.label.trim().toLowerCase() === "featured"
  )
}

function badgeColorClassName(badge: FeaturedProductCard["badges"][number]) {
  const code = badge.key.trim().toLowerCase()
  const token = badge.style_token?.trim().toLowerCase()

  if (["sale", "discount"].includes(code)) {
    return "bg-[#c8202a]"
  }
  if (code === "new-arrival" || code === "new") {
    return "bg-[#ff2d55]"
  }
  if (token === "success" || ["best-seller", "top-selling"].includes(code)) {
    return "bg-[#16a34a]"
  }
  if (token === "warning" || code === "limited-stock") {
    return "bg-[#f97316]"
  }
  if (token === "info") {
    return "bg-[#2563eb]"
  }
  if (token === "neutral" || code === "out-of-stock") {
    return "bg-[#4b5563]"
  }
  return "bg-[#ff2d55]"
}

function inventoryLabel(status: FeaturedProductCard["inventory"]["status"]) {
  if (status === "in_stock" || status === "not_managed") {
    return "In Stocks"
  }
  if (status === "low_stock") {
    return "Low stock"
  }
  if (status === "backorder") {
    return "Available on backorder"
  }
  if (status === "out_of_stock") {
    return "Out of stock"
  }
  return "Availability pending"
}

export default BestSellingProductCard
