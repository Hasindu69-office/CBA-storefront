"use client"

import { useEffect, useRef, useState } from "react"
import type { MouseEvent, ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"

import type { FeaturedProductCard } from "@lib/data/featured-products"
import { addToCart } from "@lib/data/cart"
import { notify } from "@lib/notifications"
import { convertToLocale } from "@lib/util/money"
import { openSideCart } from "@lib/util/side-cart-event"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductCardRating from "@modules/common/components/product-card-rating"
import {
  ShoppingCartIcon,
} from "@modules/layout/components/cba-icons"
import { WishlistProductButton } from "@modules/wishlist/components/wishlist-product-button"

type FeaturedProductSliderProps = {
  products: FeaturedProductCard[]
  title?: string
  description?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
  titleId?: string
  embedded?: boolean
  mobileCompactCards?: boolean
  sectionClassName?: string
}

const FeaturedProductSlider = ({
  products,
  title = "Featured Products",
  description,
  ctaLabel = "View All Products",
  ctaHref = "/store",
  titleId = "featured-products-title",
  embedded = false,
  mobileCompactCards = false,
  sectionClassName,
}: FeaturedProductSliderProps) => {
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

  const baseSectionClassName = embedded
    ? "mt-12 border-t border-gray-200 pt-10"
    : "bg-white pt-8 pb-12 sm:pt-9 sm:pb-14 md:pb-16 small:py-14"
  const resolvedSectionClassName = sectionClassName ?? baseSectionClassName
  const scrollerClassName = embedded
    ? "no-scrollbar grid auto-cols-[minmax(210px,calc((100%_-_20px)_/_2))] grid-flow-col gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 small:auto-cols-[calc((100%_-_32px)_/_3)] medium:auto-cols-[calc((100%_-_64px)_/_5)]"
    : mobileCompactCards
      ? "no-scrollbar grid auto-cols-[minmax(218px,64vw)] grid-flow-col gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scroll-px-0 pb-3 pr-5 2xsmall:auto-cols-[minmax(224px,62vw)] xsmall:auto-cols-[minmax(232px,46vw)] sm:auto-cols-[minmax(238px,42vw)] md:auto-cols-[calc((100%_-_16px)_/_2)] md:gap-4 md:pr-1 small:auto-cols-[calc((100%_-_32px)_/_3)] medium:auto-cols-[calc((100%_-_64px)_/_5)]"
      : "no-scrollbar grid auto-cols-[minmax(260px,82vw)] grid-flow-col gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scroll-px-0 pb-3 pr-4 xsmall:auto-cols-[minmax(280px,76vw)] sm:auto-cols-[minmax(300px,52vw)] md:auto-cols-[calc((100%_-_16px)_/_2)] md:pr-1 small:auto-cols-[calc((100%_-_32px)_/_3)] medium:auto-cols-[calc((100%_-_64px)_/_5)]"

  const content = (
    <>
      <div className="mb-6 flex items-start justify-between gap-6 sm:mb-7 small:mb-10">
        <div className="min-w-0">
          <h2
            id={titleId}
            className={
              embedded
                ? "text-lg font-black uppercase text-black"
                : "text-[26px] font-bold leading-[1.15] tracking-normal text-black xsmall:text-[28px] small:text-[34px]"
            }
          >
            {title}
          </h2>
          {description && (
            <p
              className={
                embedded
                  ? "mt-2 text-sm text-gray-500"
                  : "mt-3 max-w-[620px] text-[15px] leading-6 tracking-normal text-[#52525b]"
              }
            >
              {description}
            </p>
          )}
          {!embedded && <div className="mt-4 h-px w-[200px] bg-[#cfcfcf] xsmall:w-[220px] small:w-[295px]" />}
        </div>
        {ctaLabel && ctaHref && (
          <ProductSliderCta
            href={ctaHref}
            className="hidden h-11 min-w-[156px] items-center justify-center rounded border border-[#dedee5] bg-white px-6 text-[14px] font-semibold text-[#333333] transition-colors hover:border-brand hover:text-brand small:flex"
          >
            {ctaLabel}
          </ProductSliderCta>
        )}
      </div>

      <div
        ref={scrollerRef}
        className={scrollerClassName}
      >
        {products.map((product, index) => (
          <FeaturedProductCardItem
            key={product.id}
            product={product}
            priority={index < 4}
            mobileCompact={mobileCompactCards}
          />
        ))}
      </div>

      {ctaLabel && ctaHref && (
        <ProductSliderCta
          href={ctaHref}
          className="mt-8 flex h-11 items-center justify-center rounded border border-[#dedee5] bg-white px-6 text-[14px] font-semibold text-[#333333] transition-colors hover:border-brand hover:text-brand small:hidden"
        >
          {ctaLabel}
        </ProductSliderCta>
      )}
    </>
  )

  return (
    <section className={resolvedSectionClassName} aria-labelledby={titleId}>
      {embedded ? content : <div className="content-container">{content}</div>}
    </section>
  )
}

const ProductSliderCta = ({
  href,
  className,
  children,
}: {
  href: string
  className: string
  children: ReactNode
}) => {
  if (/^https?:\/\//i.test(href)) {
    return (
      <Link
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </Link>
    )
  }

  return (
    <LocalizedClientLink href={href} className={className}>
      {children}
    </LocalizedClientLink>
  )
}

export const FeaturedProductCardItem = ({
  product,
  priority,
  mobileCompact = false,
}: {
  product: FeaturedProductCard
  priority: boolean
  mobileCompact?: boolean
}) => {
  const countryCode = useParams().countryCode as string
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const isPurchasable =
    !!product.default_variant?.id &&
    product.inventory.purchasable &&
    product.price.status === "available"
  const displayBadges = product.badges
    .filter((badge) => !isFeaturedBadge(badge) && !isBenefitBadge(badge))
    .slice(0, 2)
  const benefitItems = productCardBenefits(product)

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

    const toastId = `featured-cart:${product.default_variant.id}`
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

  return (
    <article
      data-featured-product-card
      className={[
        "group flex min-w-0 snap-start flex-col overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white transition-colors hover:border-black medium:h-[468px]",
        mobileCompact
          ? "h-[342px] small:h-[356px]"
          : "h-[436px] xsmall:h-[454px] sm:h-[468px] md:h-[488px] small:h-[512px]",
      ].join(" ")}
    >
      <div
        className={[
          "relative flex-shrink-0 overflow-hidden rounded-t-[8px] bg-white medium:h-[212px] large:h-[224px]",
          mobileCompact
            ? "h-[142px] small:h-[156px]"
            : "h-[188px] xsmall:h-[202px] sm:h-[214px] md:h-[226px] small:h-[250px]",
        ].join(" ")}
      >
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
              sizes="(min-width: 1280px) 190px, (min-width: 1024px) 28vw, (min-width: 768px) 45vw, 82vw"
              className={[
                "object-contain object-center transition-transform duration-300 group-hover:scale-[1.03] medium:p-4",
                mobileCompact ? "p-3 small:p-4" : "p-4 sm:p-5",
              ].join(" ")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PlaceholderImage size={36} />
            </div>
          )}
        </LocalizedClientLink>

        {!!displayBadges.length && (
          <div
            className={[
              "absolute flex max-w-[calc(100%-64px)] flex-wrap gap-1.5 medium:left-3 medium:top-4 medium:max-w-[calc(100%-72px)]",
              mobileCompact ? "left-2.5 top-3" : "left-3 top-3",
            ].join(" ")}
          >
            {displayBadges.map((badge) => (
              <span
                key={badge.key}
                className={`${badgeColorClassName(
                  badge
                )} min-w-[64px] rounded-[6px] px-2 py-1 text-center text-[9px] font-bold uppercase leading-3 text-white medium:min-w-[68px] medium:px-2.5 medium:text-[10px] medium:leading-4`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}

        <WishlistProductButton
          productId={product.product_id ?? product.id}
          variantId={product.default_variant?.id}
          productTitle={product.title}
          toastId={`featured-wishlist:${product.id}`}
        />

        {product.price.discount_percentage !== null && (
          <div
            className={[
              "absolute z-10 flex flex-col items-center justify-center rounded-full bg-[#ff2d55] text-center text-white shadow-[0_10px_24px_rgba(255,45,85,0.28)] medium:right-4 medium:top-[62px] medium:h-[48px] medium:w-[48px]",
              mobileCompact
                ? "right-3 top-[58px] h-[40px] w-[40px]"
                : "right-4 top-[62px] h-[48px] w-[48px]",
            ].join(" ")}
          >
            <span
              className={[
                "font-bold medium:text-[14px] medium:leading-[15px]",
                mobileCompact ? "text-[12px] leading-[13px]" : "text-[14px] leading-[15px]",
              ].join(" ")}
            >
              {product.price.discount_percentage}%
            </span>
            <span
              className={[
                "font-bold uppercase medium:text-[8px] medium:leading-[10px]",
                mobileCompact ? "text-[7px] leading-[9px]" : "text-[8px] leading-[10px]",
              ].join(" ")}
            >
              Off
            </span>
          </div>
        )}

        {!!benefitItems.length && (
          <div
            className={[
              "absolute bottom-2 left-2.5 right-2.5 z-10 h-8 items-center justify-center overflow-hidden rounded-[6px] bg-[#fff3ed] pt-0.5 text-[#ff5c0e] shadow-sm",
              mobileCompact ? "hidden medium:flex" : "flex",
            ].join(" ")}
          >
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
        )}
      </div>

      <div
        className={[
          "flex min-h-0 flex-1 flex-col medium:px-3 medium:py-3",
          mobileCompact ? "px-2.5 py-2.5" : "px-3 py-3 sm:px-3.5 sm:py-3.5 small:px-3 small:py-3",
        ].join(" ")}
      >
        <div className="flex min-h-[22px] items-center gap-2">
          {product.brand?.logo_url ? (
            <span className="relative block h-5 w-[72px] flex-shrink-0">
              <Image
                src={product.brand.logo_url}
                alt={product.brand.logo_alt_text || `${product.brand.name} logo`}
                fill
                sizes="72px"
                className="object-contain object-left"
              />
            </span>
          ) : product.brand?.name ? (
            <span className="line-clamp-1 text-[11px] font-bold uppercase leading-4 text-black">
              {product.brand.name}
            </span>
          ) : null}
          {product.brand?.name && product.category?.name && (
            <span className="h-4 w-px flex-shrink-0 bg-[#d4d4d8]" />
          )}
          {product.category?.name && (
            <span className="line-clamp-1 text-[11px] leading-4 text-[#9a9aa0]">
              {product.category.name}
            </span>
          )}
        </div>

        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className={[
            "block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 medium:mt-2",
            mobileCompact ? "mt-1.5" : "mt-2",
          ].join(" ")}
        >
          <h3
            className={[
              "line-clamp-2 font-bold tracking-normal text-black medium:min-h-[42px] medium:text-[15px] medium:leading-5",
              mobileCompact
                ? "min-h-[38px] text-[14px] leading-[19px]"
                : "min-h-[40px] text-[15px] leading-5 sm:min-h-[42px] sm:text-[16px] sm:leading-[21px]",
            ].join(" ")}
          >
            {product.title}
          </h3>
        </LocalizedClientLink>

        <div
          className={[
            "mt-2 min-h-[22px] items-center justify-between gap-2",
            "flex",
          ].join(" ")}
        >
          <ProductCardRating rating={product.rating} compact={mobileCompact} />
          <span
            className={`line-clamp-1 flex-shrink-0 ${
              mobileCompact
                ? "text-[8px] leading-3 xsmall:text-[9px] medium:text-[10px] medium:leading-4"
                : "text-[10px] leading-4"
            } ${
              product.inventory.in_stock || product.inventory.allow_backorder
                ? "text-[#69be3b]"
                : "text-[#a1a1aa]"
            }`}
          >
            <span
              className={[
                "mr-1 inline-block rounded-full bg-current",
                mobileCompact
                  ? "h-1.5 w-1.5 align-middle medium:h-2 medium:w-2"
                  : "h-2 w-2",
              ].join(" ")}
            />
            {inventoryLabel(product.inventory.status)}
          </span>
        </div>

        <div
          className={[
            "border-t border-[#e5e7eb] pt-2.5 medium:mt-auto",
            mobileCompact ? "mt-3" : "mt-auto",
          ].join(" ")}
        >
          <ProductCardPrice product={product} mobileCompact={mobileCompact} />
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isPurchasable || isAddingToCart}
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-[8px] border border-black bg-white px-3 text-[11px] font-bold uppercase tracking-normal text-black transition-colors hover:bg-black hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[#d4d4d8] disabled:text-[#a1a1aa] disabled:hover:bg-white sm:h-10"
          >
            <ShoppingCartIcon size={16} />
            {isAddingToCart ? "Adding..." : "Add to cart"}
          </button>
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

const ProductCardPrice = ({
  product,
  mobileCompact = false,
}: {
  product: FeaturedProductCard
  mobileCompact?: boolean
}) => {
  if (
    product.price.status !== "available" ||
    product.price.calculated_amount === null
  ) {
    return (
      <p className="text-[14px] font-bold leading-5 text-black">
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
    <div
      className={[
        "min-h-[26px] min-w-0 overflow-hidden medium:flex medium:items-baseline medium:gap-2",
        mobileCompact ? "flex flex-col gap-0.5" : "flex items-baseline gap-2",
      ].join(" ")}
    >
      <span className="min-w-0 flex-shrink text-[15px] font-bold leading-6 text-black medium:text-[14px] large:text-[15px]">
        {calculated}
      </span>
      {original && (
        <span
          className={[
            "min-w-0 text-[#8a8a8f] line-through medium:flex-1 medium:truncate medium:text-[10px] medium:font-medium medium:leading-4",
            mobileCompact
              ? "block text-[11px] font-semibold leading-3"
              : "flex-1 truncate text-[10px] font-medium leading-4",
          ].join(" ")}
        >
          {original}
        </span>
      )}
    </div>
  )
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
  return badges.some((badge) => normalizeBadgeValue(badge.key) === "free-shipping")
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
