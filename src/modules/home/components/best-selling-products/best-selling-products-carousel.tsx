"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { FeaturedProductCard } from "@lib/data/featured-products"
import BestSellingProductCard from "./best-selling-product-card"

type BestSellingProductsCarouselProps = {
  products: FeaturedProductCard[]
}

const BestSellingProductsCarousel = ({
  products,
}: BestSellingProductsCarouselProps) => {
  const visibleProducts = useMemo(() => products.slice(0, 5), [products])
  const trackRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current
    if (!track) {
      return
    }

    const cards = Array.from(
      track.querySelectorAll<HTMLElement>("[data-best-selling-product-card]")
    )
    if (!cards.length) {
      setActiveIndex(0)
      return
    }

    const nextIndex = cards.reduce(
      (closest, card, index) => {
        const distance = Math.abs(card.offsetLeft - track.scrollLeft)
        return distance < closest.distance ? { index, distance } : closest
      },
      { index: 0, distance: Number.POSITIVE_INFINITY }
    ).index

    setActiveIndex(nextIndex)
  }, [])

  const handleScroll = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
    }

    frameRef.current = window.requestAnimationFrame(() => {
      updateActiveIndex()
      frameRef.current = null
    })
  }, [updateActiveIndex])

  const handleDotClick = useCallback((index: number) => {
    const track = trackRef.current
    const card = track?.querySelectorAll<HTMLElement>(
      "[data-best-selling-product-card]"
    )[index]

    card?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    })
  }, [])

  useEffect(() => {
    updateActiveIndex()

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [updateActiveIndex])

  return (
    <>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory justify-start gap-3 overflow-x-auto scroll-smooth pb-5 pl-0 pr-2 [&>[data-best-selling-product-card]]:w-[min(78vw,280px)] xsmall:[&>[data-best-selling-product-card]]:w-[calc((100%_-_12px)_/_2)] small:[&>[data-best-selling-product-card]]:w-[220px] medium:grid medium:grid-cols-5 medium:items-stretch medium:gap-3 medium:overflow-visible medium:pb-0 medium:pr-0 medium:[&>[data-best-selling-product-card]]:w-full large:gap-4"
      >
        {visibleProducts.map((product, index) => (
          <BestSellingProductCard
            key={product.id}
            product={product}
            priority={index < 5}
          />
        ))}
      </div>

      {visibleProducts.length > 1 && (
        <div
          className="mt-2 flex items-center justify-center gap-3 medium:hidden"
          aria-label="Best selling products carousel pagination"
        >
          {visibleProducts.map((product, index) => {
            const isActive = index === activeIndex

            return (
              <button
                key={product.id}
                type="button"
                aria-label={`Show product ${index + 1} of ${
                  visibleProducts.length
                }`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => handleDotClick(index)}
                className={`h-2.5 w-2.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  isActive ? "bg-brand" : "bg-white/40"
                }`}
              />
            )
          })}
        </div>
      )}
    </>
  )
}

export default BestSellingProductsCarousel
