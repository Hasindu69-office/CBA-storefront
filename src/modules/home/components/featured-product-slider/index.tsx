"use client"

import { MouseEvent, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"

import type { FeaturedProductCard } from "@lib/data/featured-products"
import { addToCart } from "@lib/data/cart"
import { addFeaturedProductToWishlist } from "@lib/data/wishlist"
import { convertToLocale } from "@lib/util/money"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  HeartIcon,
  ShoppingCartIcon,
} from "@modules/layout/components/cba-icons"

type FeaturedProductSliderProps = {
  products: FeaturedProductCard[]
}

const FeaturedProductSlider = ({ products }: FeaturedProductSliderProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (products.length < 2) {
      return
    }

    const interval = window.setInterval(() => {
      const scroller = scrollerRef.current
      if (!scroller) {
        return
      }

      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
      if (maxScrollLeft <= 0) {
        return
      }

      const firstCard = scroller.querySelector<HTMLElement>("[data-featured-product-card]")
      const scrollDistance = firstCard
        ? firstCard.offsetWidth +
          Number.parseFloat(window.getComputedStyle(scroller).columnGap || "0")
        : scroller.clientWidth

      const nextLeft =
        scroller.scrollLeft + scrollDistance >= maxScrollLeft - 8
          ? 0
          : scroller.scrollLeft + scrollDistance

      scroller.scrollTo({
        left: nextLeft,
        behavior: "smooth",
      })
    }, 3500)

    return () => window.clearInterval(interval)
  }, [products.length])

  if (!products.length) {
    return null
  }

  return (
    <section
      className="bg-white py-10 small:py-14"
      aria-labelledby="featured-products-title"
    >
      <div className="content-container">
        <div className="mb-8 flex items-start justify-between gap-6 small:mb-10">
          <div className="min-w-0">
            <h2
              id="featured-products-title"
              className="text-[30px] font-bold leading-[1.15] tracking-normal text-black small:text-[34px]"
            >
              Featured Products
            </h2>
            <div className="mt-4 h-px w-[220px] bg-[#cfcfcf] small:w-[295px]" />
          </div>
          <LocalizedClientLink
            href="/store"
            className="hidden h-11 min-w-[156px] items-center justify-center rounded border border-[#dedee5] bg-white px-6 text-[14px] font-semibold text-[#333333] transition-colors hover:border-brand hover:text-brand small:flex"
          >
            View All Products
          </LocalizedClientLink>
        </div>

        <div
          ref={scrollerRef}
          className="no-scrollbar grid auto-cols-[minmax(300px,calc(100vw_-_48px))] grid-flow-col gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory scroll-px-0 pb-2 pr-1 small:auto-cols-[calc((100%_-_40px)_/_3)] medium:auto-cols-[calc((100%_-_60px)_/_4)]"
        >
          {products.map((product, index) => (
            <FeaturedProductCardItem
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>

        <LocalizedClientLink
          href="/store"
          className="mt-7 flex h-11 items-center justify-center rounded border border-[#dedee5] bg-white px-6 text-[14px] font-semibold text-[#333333] transition-colors hover:border-brand hover:text-brand small:hidden"
        >
          View All Products
        </LocalizedClientLink>
      </div>
    </section>
  )
}

const FeaturedProductCardItem = ({
  product,
  priority,
}: {
  product: FeaturedProductCard
  priority: boolean
}) => {
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
    .slice(0, 2)

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
      data-featured-product-card
      className="group flex h-[568px] min-w-0 snap-start flex-col overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white transition-colors hover:border-brand/50"
    >
      <div className="relative h-[300px] flex-shrink-0 overflow-hidden rounded-t-[8px] bg-[#f7f7f8]">
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
              sizes="(min-width: 1280px) 300px, (min-width: 1024px) 30vw, calc(100vw - 96px)"
              className="object-contain object-center p-7 transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PlaceholderImage size={36} />
            </div>
          )}
        </LocalizedClientLink>

        {!!displayBadges.length && (
          <div className="absolute left-4 top-4 flex max-w-[calc(100%-84px)] flex-wrap gap-2">
            {displayBadges.map((badge) => (
              <span
                key={badge.key}
                className={`${badgeColorClassName(
                  badge
                )} min-w-[86px] rounded-[6px] px-4 py-2 text-center text-[13px] font-bold uppercase leading-5 text-white`}
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
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#ff3b30] shadow-sm transition-colors hover:bg-[#fff3f0] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <HeartIcon size={21} strokeWidth={1.8} />
        </button>

      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
        <div className="flex min-h-[25px] items-center gap-3">
          {product.brand?.logo_url ? (
            <span className="relative block h-6 w-[92px] flex-shrink-0">
              <Image
                src={product.brand.logo_url}
                alt={product.brand.logo_alt_text || `${product.brand.name} logo`}
                fill
                sizes="92px"
                className="object-contain object-left"
              />
            </span>
          ) : product.brand?.name ? (
            <span className="line-clamp-1 text-[13px] font-bold uppercase leading-5 text-black">
              {product.brand.name}
            </span>
          ) : null}
          {product.brand?.name && product.category?.name && (
            <span className="h-5 w-px flex-shrink-0 bg-[#d4d4d8]" />
          )}
          {product.category?.name && (
            <span className="line-clamp-1 text-[13px] leading-5 text-[#9a9aa0]">
              {product.category.name}
            </span>
          )}
        </div>

        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="mt-3 block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <h3 className="line-clamp-2 min-h-[50px] text-[21px] font-bold leading-[25px] tracking-normal text-black">
            {product.title}
          </h3>
        </LocalizedClientLink>

        <div className="mt-3 flex min-h-[24px] items-center justify-between gap-3">
          <ProductRating rating={product.rating} />
          <span
            className={`line-clamp-1 flex-shrink-0 text-[12px] leading-5 ${
              product.inventory.in_stock || product.inventory.allow_backorder
                ? "text-[#69be3b]"
                : "text-[#a1a1aa]"
            }`}
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current" />
            {inventoryLabel(product.inventory.status)}
          </span>
        </div>

        <div className="mt-auto border-t border-[#e5e7eb] pt-3">
          <ProductCardPrice product={product} />
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isPurchasable || isAddingToCart}
            className="mt-4 flex h-[46px] w-full items-center justify-center gap-2 rounded-[8px] border border-brand bg-white px-4 text-[13px] font-bold uppercase tracking-normal text-brand transition-colors hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[#d4d4d8] disabled:text-[#a1a1aa] disabled:hover:bg-white"
          >
            <ShoppingCartIcon size={18} />
            {isAddingToCart ? "Adding..." : "Add to cart"}
          </button>
          <p
            aria-live="polite"
            className={`mt-2 min-h-[18px] text-[12px] leading-[18px] ${
              statusMessage.toLowerCase().includes("could not") ||
              statusMessage.toLowerCase().includes("invalid")
                ? "text-[#dc2626]"
                : "text-[#52525b]"
            }`}
          >
            {statusMessage}
          </p>
        </div>
      </div>
    </article>
  )
}

function isFeaturedBadge(badge: FeaturedProductCard["badges"][number]) {
  return (
    badge.key.trim().toLowerCase() === "featured" ||
    badge.label.trim().toLowerCase() === "featured"
  )
}

function badgeColorClassName(badge: FeaturedProductCard["badges"][number]) {
  const code = normalizeBadgeValue(badge.key)
  const token = normalizeBadgeValue(badge.style_token)

  if (token && token !== "default") {
    return badgeTokenColorClassName(token)
  }

  if (["sale", "discount"].includes(code)) {
    return "bg-[#c8202a]"
  }
  if (code === "new-arrival") {
    return "bg-[#ff2d55]"
  }
  if (["best-seller", "top-selling"].includes(code)) {
    return "bg-[#16a34a]"
  }
  if (code === "top-rated") {
    return "bg-[#f59e0b]"
  }
  if (code === "limited-stock") {
    return "bg-[#f97316]"
  }
  if (code === "out-of-stock") {
    return "bg-[#6b7280]"
  }
  if (["free-shipping", "free-gift", "online-exclusive"].includes(code)) {
    return "bg-[#2563eb]"
  }

  return badgeTokenColorClassName(token)
}

function badgeTokenColorClassName(token: string) {
  switch (token) {
    case "accent":
      return "bg-[#c026d3]"
    case "success":
      return "bg-[#16a34a]"
    case "warning":
      return "bg-[#f97316]"
    case "info":
      return "bg-[#2563eb]"
    case "neutral":
      return "bg-[#4b5563]"
    case "default":
    default:
      return "bg-[#ff2d55]"
  }
}

function normalizeBadgeValue(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
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
      <p className="text-[17px] font-bold leading-6 text-black">
        Contact for price
      </p>
    )
  }

  const calculated = formatPrice(
    product.price.calculated_amount,
    product.price.currency_code
  )
  const original =
    product.price.has_discount && product.price.original_amount !== null
      ? formatPrice(product.price.original_amount, product.price.currency_code)
      : null

  return (
    <div className="flex min-h-[30px] flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-[21px] font-bold leading-7 text-black">
        {calculated}
      </span>
      {original && (
        <span className="text-[13px] font-medium leading-5 text-[#8a8a8f] line-through">
          {original}
        </span>
      )}
      {product.price.discount_percentage !== null && (
        <span className="text-[12px] font-semibold leading-5 text-brand">
          {product.price.discount_percentage}% off
        </span>
      )}
    </div>
  )
}

function formatPrice(amount: number, currencyCode: string) {
  return convertToLocale({
    amount,
    currency_code: currencyCode,
    maximumFractionDigits: 2,
  })
}

function inventoryLabel(status: FeaturedProductCard["inventory"]["status"]) {
  if (status === "in_stock" || status === "not_managed") {
    return "In stock"
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

export default FeaturedProductSlider
