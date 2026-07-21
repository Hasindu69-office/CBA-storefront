"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

import type { FeaturedProductCard } from "@lib/data/featured-products"
import { convertToLocale } from "@lib/util/money"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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
          className="no-scrollbar grid auto-cols-[minmax(272px,calc(100vw_-_48px))] grid-flow-col gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory scroll-px-0 pb-2 pr-1 small:auto-cols-[calc((100%_-_40px)_/_3)] medium:auto-cols-[calc((100%_-_60px)_/_4)]"
        >
          {products.map((product, index) => (
            <LocalizedClientLink
              key={product.id}
              href={`/products/${product.handle}`}
              data-featured-product-card
              className="group flex h-[438px] min-w-0 snap-start flex-col overflow-hidden rounded-[14px] border border-[#ececf0] bg-white transition-colors hover:border-brand/50"
            >
              <div className="relative h-[226px] flex-shrink-0 bg-[#f7f7f8] p-5">
                {product.thumbnail?.url ? (
                  <Image
                    src={product.thumbnail.url}
                    alt={product.thumbnail.alt || product.title}
                    fill
                    priority={index < 4}
                    sizes="(min-width: 1280px) 300px, (min-width: 1024px) 30vw, calc(100vw - 96px)"
                    className="object-contain object-center p-5 transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <PlaceholderImage size={32} />
                  </div>
                )}
                {!!product.badges.length && (
                  <div className="absolute left-4 top-4 flex max-w-[calc(100%-32px)] flex-wrap gap-2">
                    {product.badges.slice(0, 2).map((badge) => (
                      <span
                        key={badge.key}
                        className="rounded bg-brand px-3 py-1 text-[12px] font-semibold leading-5 text-white"
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex min-h-0 flex-1 flex-col p-5">
                <div className="min-h-[46px]">
                  <h3 className="line-clamp-2 text-[18px] font-bold leading-[23px] tracking-normal text-black">
                    {product.title}
                  </h3>
                </div>

                <div className="mt-2 min-h-[42px]">
                  <p className="line-clamp-2 text-[14px] leading-[21px] tracking-normal text-[#555555]">
                    {product.subtitle ||
                      product.brand?.name ||
                      product.category?.name ||
                      "CBA selected product"}
                  </p>
                </div>

                <div className="mt-3 flex min-h-[24px] flex-wrap items-center gap-2">
                  {product.brand?.name && (
                    <span className="line-clamp-1 max-w-full rounded border border-[#e4e4e7] px-2 py-0.5 text-[12px] font-medium leading-5 text-[#3f3f46]">
                      {product.brand.name}
                    </span>
                  )}
                  {product.category?.name && (
                    <span className="line-clamp-1 max-w-full rounded border border-[#e4e4e7] px-2 py-0.5 text-[12px] font-medium leading-5 text-[#3f3f46]">
                      {product.category.name}
                    </span>
                  )}
                  {product.rating && product.rating.count > 0 && (
                    <span className="text-[13px] font-medium leading-5 text-[#52525b]">
                      {product.rating.average.toFixed(1)} ({product.rating.count})
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-4">
                  <ProductCardPrice product={product} />
                  <p className="mt-2 text-[13px] font-medium leading-5 text-[#52525b]">
                    {inventoryLabel(product.inventory.status)}
                  </p>
                </div>
              </div>
            </LocalizedClientLink>
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
    <div className="flex min-h-[28px] flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-[18px] font-bold leading-7 text-black">
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
