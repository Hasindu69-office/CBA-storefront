"use client"

import { MouseEvent, ReactNode, useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"

import { addToCart } from "@lib/data/cart"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import { addFeaturedProductToWishlist } from "@lib/data/wishlist"
import { notify } from "@lib/notifications"
import { convertToLocale } from "@lib/util/money"
import { openSideCart } from "@lib/util/side-cart-event"
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
  const countryCode = useParams().countryCode as string
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)

  const isPurchasable =
    !!product.default_variant?.id &&
    product.inventory.purchasable &&
    product.price.status === "available"
  const displayBadges = product.badges
    .filter((badge) => !isFeaturedBadge(badge) && !isBenefitBadge(badge))
    .slice(0, 1)
  const benefitItems = productCardBenefits(product)
  const isFlat = variant === "flat"
  const sizeClassName =
    variant === "flat"
      ? "h-[342px] w-full min-w-0 medium:h-full"
      : "h-[400px] w-[220px] min-w-0 flex-none snap-start md:h-[430px] small:h-[400px] medium:h-full medium:w-full"

  const handleAddToCart = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!product.default_variant?.id) {
      notify.error("Please select a valid product.")
      return
    }

    if (!isPurchasable) {
      notify.warning(inventoryLabel(product.inventory.status))
      return
    }

    const toastId = `best-selling-cart:${product.default_variant.id}`
    notify.loading("Adding item to cart...", { id: toastId })
    openSideCart({ pendingMessage: "Adding item to cart.", refresh: false })
    setIsAddingToCart(true)

    try {
      await addToCart({
        variantId: product.default_variant.id,
        quantity: 1,
        countryCode,
      })
      openSideCart({ pendingMessage: "Updating cart.", refresh: true })
      notify.success("Item added to cart.", { id: toastId })
    } catch (error) {
      openSideCart({ pendingMessage: null, refresh: false })
      notify.error(error, "Could not add this item to your cart.", {
        id: toastId,
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleAddToWishlist = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!product.default_variant?.id) {
      notify.error("Please select a valid product.")
      return
    }

    const toastId = `best-selling-wishlist:${product.id}`
    notify.loading("Adding item to wishlist...", { id: toastId })
    setIsAddingToWishlist(true)

    const result = await addFeaturedProductToWishlist({
      productId: product.product_id ?? product.id,
      variantId: product.default_variant.id,
    })

    if (result.success) {
      if (result.status === "already_present") {
        notify.info(result.message, { id: toastId })
      } else {
        notify.success(result.message, { id: toastId })
      }
    } else {
      notify.error(result.message, "Could not add this item to wishlist.", {
        id: toastId,
      })
    }
    setIsAddingToWishlist(false)
  }

  return (
    <article
      data-best-selling-product-card
      className={`group flex ${sizeClassName} flex-col overflow-hidden rounded-[8px] border border-[#ededed] bg-white transition-shadow ${
        isFlat
          ? "shadow-none hover:shadow-none"
          : "shadow-[0_12px_28px_rgba(0,0,0,0.16)] hover:shadow-[0_0_24px_rgba(255,92,24,0.72)]"
      }`}
    >
      <div className="relative aspect-[4/3] w-full flex-shrink-0 overflow-hidden rounded-t-[8px] border-b border-[#f0f0f0] bg-white md:aspect-[16/9] small:aspect-[4/3]">
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
              sizes={
                isFlat
                  ? "(min-width: 1280px) 20vw, (min-width: 1024px) 28vw, 50vw"
                  : "(min-width: 1280px) 20vw, (min-width: 768px) 50vw, 220px"
              }
              className={`object-contain object-center transition-transform duration-300 group-hover:scale-[1.03] ${
                isFlat ? "p-2.5 xsmall:p-3 medium:p-3 large:p-4" : "p-3.5 medium:p-3 large:p-4"
              }`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PlaceholderImage size={34} />
            </div>
          )}
        </LocalizedClientLink>

        {!!displayBadges.length && (
          <div className={`${isFlat ? "left-1.5 top-1.5 max-w-[78px] xsmall:left-2 xsmall:top-2 xsmall:max-w-[96px] medium:max-w-[108px]" : "left-2 top-2 max-w-[108px]"} absolute`}>
            {displayBadges.map((badge) => (
              <span
                key={badge.key}
                className={`${badgeColorClassName(
                  badge
                )} block rounded-[5px] px-2 py-0.5 text-center text-[8px] font-bold uppercase leading-3 text-white xsmall:px-2.5 xsmall:py-1 xsmall:text-[9px]`}
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
          className={`absolute flex items-center justify-center rounded-full bg-white text-[#ff3b30] shadow-[0_10px_22px_rgba(0,0,0,0.16)] transition-colors hover:bg-[#fff3f0] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            isFlat
              ? "right-2 top-2 h-7 w-7 medium:h-7 medium:w-7"
              : "right-2.5 top-2.5 h-8 w-8 medium:h-7 medium:w-7"
          }`}
        >
          <HeartIcon size={isFlat ? 15 : 16} strokeWidth={1.7} />
        </button>
      </div>

      {benefitItems.length ? (
        <div className="flex h-8 flex-shrink-0 items-center justify-center overflow-hidden bg-[#fff3ed] px-2.5 text-[#ff5c0e]">
          {benefitItems.map((item, index) => (
            <div
              key={item.key}
              className="flex min-w-0 flex-1 translate-y-px items-center justify-center gap-1.5 px-1.5"
            >
              {index > 0 && (
                <span className="mr-1.5 h-4 w-px flex-shrink-0 bg-[#ffc5ae]" />
              )}
              {item.icon}
              <span className="truncate text-[9px] font-bold uppercase leading-3">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div aria-hidden="true" className="h-8 flex-shrink-0" />
      )}

      <div className={`flex min-h-0 flex-1 flex-col large:px-3.5 ${
        isFlat ? "px-2.5 py-2 medium:px-3 medium:py-2.5" : "px-3 py-2.5"
      }`}>
        <div className="flex min-h-[20px] items-center gap-2">
          {product.brand?.logo_url ? (
            <span className={`relative block flex-shrink-0 ${
              isFlat ? "h-[16px] w-[44px] medium:h-[18px] medium:w-[50px]" : "h-[18px] w-[50px]"
            }`}>
              <Image
                src={product.brand.logo_url}
                alt={product.brand.logo_alt_text || `${product.brand.name} logo`}
                fill
                sizes="50px"
                className="object-contain object-left"
              />
            </span>
          ) : product.brand?.name ? (
            <span className={`line-clamp-1 font-bold uppercase text-black ${
              isFlat ? "max-w-[48px] text-[9px] leading-4 medium:max-w-[58px] medium:text-[10px]" : "max-w-[58px] text-[10px] leading-4"
            }`}>
              {product.brand.name}
            </span>
          ) : null}
          {product.brand?.name && product.category?.name && (
            <span className="h-4 w-px flex-shrink-0 bg-[#d4d4d8]" />
          )}
          {product.category?.name && (
            <span className={`line-clamp-1 leading-4 text-[#9ca3af] ${
              isFlat ? "text-[9px] medium:text-[10px]" : "text-[10px]"
            }`}>
              {product.category.name}
            </span>
          )}
        </div>

        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="mt-1 block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <h3 className={`line-clamp-2 font-bold tracking-normal text-black ${
            isFlat
              ? "min-h-[36px] text-[12px] leading-[18px] xsmall:text-[13px] xsmall:leading-[19px] medium:min-h-[40px] medium:text-[14px] medium:leading-5 large:text-[15px]"
              : "min-h-[40px] text-[13px] leading-5 medium:text-[14px] large:text-[15px]"
          }`}>
            {product.title}
          </h3>
        </LocalizedClientLink>

        <div className={`mt-1 min-h-[20px] items-center justify-between gap-2 ${
          isFlat ? "hidden medium:flex" : "flex"
        }`}>
          <ProductRating rating={product.rating} />
          <span
            className={`line-clamp-1 flex-shrink-0 text-[10px] leading-4 ${
              product.inventory.in_stock || product.inventory.allow_backorder
                ? "text-[#69be3b]"
                : "text-[#a1a1aa]"
            }`}
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current" />
            {inventoryLabel(product.inventory.status)}
          </span>
        </div>

        <div className={`mt-auto flex items-center justify-between gap-2 border-t border-[#e5e7eb] ${
          isFlat
            ? "-mx-2.5 min-h-[48px] px-2.5 pt-2 medium:-mx-3 medium:min-h-[52px] medium:px-3 large:-mx-3.5 large:px-3.5"
            : "-mx-3 min-h-[52px] px-3 pt-2 large:-mx-3.5 large:px-3.5"
        }`}>
          <ProductCardPrice product={product} />
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isPurchasable || isAddingToCart}
            aria-label={`Add ${product.title} to cart`}
            title={isAddingToCart ? "Adding to cart" : "Add to cart"}
            className={`flex flex-shrink-0 items-center justify-center rounded-[8px] border border-brand bg-white text-brand transition-colors hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[#d4d4d8] disabled:text-[#a1a1aa] disabled:hover:bg-white ${
              isFlat ? "h-8 w-9 medium:h-8 medium:w-9" : "h-9 w-10 medium:h-8 medium:w-9"
            }`}
          >
            <ShoppingCartIcon size={15} />
          </button>
        </div>
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
      <span className="text-[10px] font-medium leading-4 text-[#8a8a8f]">
        No reviews
      </span>
    )
  }

  return (
    <span className="flex min-w-0 items-center gap-1 text-[10px] leading-4">
      <span className="text-[15px] leading-none text-brand" aria-hidden="true">
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
      <p className="min-w-0 flex-1 text-[11px] font-bold leading-4 text-black medium:text-[12px]">
        Contact for price
      </p>
    )
  }

  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="whitespace-normal break-words text-[11px] font-bold leading-4 text-black medium:text-[12px]">
        {convertToLocale({
          amount: product.price.calculated_amount,
          currency_code: product.price.currency_code,
          maximumFractionDigits: 2,
        })}
      </span>
      {product.price.has_discount && product.price.original_amount !== null && (
        <span className="truncate text-[10px] font-medium leading-4 text-[#8a8a8f] line-through">
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

function isBenefitBadge(badge: FeaturedProductCard["badges"][number]) {
  const key = normalizeBadgeValue(badge.key)
  return key === "free-shipping"
}

function productCardBenefits(product: FeaturedProductCard) {
  const benefits: Array<{
    key: string
    label: string
    icon: ReactNode
  }> = []

  if (product.benefits?.free_delivery || hasFreeShippingBadge(product.badges)) {
    benefits.push({
      key: "free-delivery",
      label: "Free Delivery",
      icon: <DeliveryIcon />,
    })
  }

  if (product.benefits?.warranty?.label) {
    benefits.push({
      key: "warranty",
      label: product.benefits.warranty.label,
      icon: <WarrantyIcon />,
    })
  }

  return benefits
}

function hasFreeShippingBadge(badges: FeaturedProductCard["badges"]) {
  return badges.some(
    (badge) => normalizeBadgeValue(badge.key) === "free-shipping"
  )
}

function normalizeBadgeValue(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

const DeliveryIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 flex-shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 7h11v9H3z" />
    <path d="M14 10h3l3 3v3h-6z" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
    <path d="M5 5h6" />
  </svg>
)

const WarrantyIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4 flex-shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3l7 3v5c0 4.5-2.8 8.4-7 10-4.2-1.6-7-5.5-7-10V6z" />
    <path d="M9 12l2 2 4-5" />
  </svg>
)

export default BestSellingProductCard
