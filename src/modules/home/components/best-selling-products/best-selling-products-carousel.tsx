"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { FeaturedProductCard } from "@lib/data/featured-products"
import type { KokoCheckoutBranding } from "@lib/data/koko-branding"
import { FeaturedProductCardItem } from "@modules/home/components/featured-product-slider"
import BestSellingProductCard from "./best-selling-product-card"

type BestSellingProductsCarouselProps = {
  products: FeaturedProductCard[]
  kokoBranding?: KokoCheckoutBranding | null
  kokoAvailable?: boolean
}

const BestSellingProductsCarousel = ({
  products,
  kokoBranding,
  kokoAvailable = false,
}: BestSellingProductsCarouselProps) => {
  const visibleProducts = useMemo(() => products.slice(0, 5), [products])
  const trackRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [pageIndexes, setPageIndexes] = useState([0])

  const updateCarouselState = useCallback(() => {
    const track = trackRef.current
    if (!track) {
      return
    }

    const cards = getCarouselCards(track)
    if (!cards.length) {
      setActiveIndex(0)
      return
    }

    const scrollEnd = Math.max(0, track.scrollWidth - track.clientWidth)
    const nextPageIndexes = cards
      .map((card) => card.offsetLeft)
      .filter((offset, index, offsets) => {
        const clampedOffset = Math.min(offset, scrollEnd)
        return (
          index === 0 || clampedOffset > Math.min(offsets[index - 1], scrollEnd)
        )
      })
      .map((offset) => {
        const clampedOffset = Math.min(offset, scrollEnd)

        return cards.reduce(
          (closest, card, index) => {
            const distance = Math.abs(card.offsetLeft - clampedOffset)
            return distance < closest.distance ? { index, distance } : closest
          },
          { index: 0, distance: Number.POSITIVE_INFINITY }
        ).index
      })

    setPageIndexes(nextPageIndexes.length ? nextPageIndexes : [0])

    const nextIndex = nextPageIndexes.reduce(
      (closest, card, index) => {
        const distance = Math.abs(cards[card].offsetLeft - track.scrollLeft)
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
      updateCarouselState()
      frameRef.current = null
    })
  }, [updateCarouselState])

  const handleDotClick = useCallback((index: number) => {
    const track = trackRef.current
    const productIndex = pageIndexes[index] ?? index
    const card = track ? getCarouselCards(track)[productIndex] : undefined

    card?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    })
  }, [pageIndexes])

  useEffect(() => {
    updateCarouselState()

    window.addEventListener("resize", updateCarouselState)

    return () => {
      window.removeEventListener("resize", updateCarouselState)

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [updateCarouselState])

  return (
    <>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory justify-start gap-3 overflow-x-auto scroll-smooth pb-5 pl-0 pr-0 medium:grid medium:grid-cols-5 medium:items-stretch medium:gap-3 medium:overflow-visible medium:pb-0 medium:pr-0 large:gap-4"
      >
        {visibleProducts.map((product, index) => (
          <div
            key={product.id}
            data-best-selling-carousel-card
            className="w-[calc((100%_-_12px)_/_2)] min-w-0 flex-none snap-start medium:w-full medium:flex-auto"
          >
            <div className="medium:hidden">
              <FeaturedProductCardItem
                product={product}
                priority={index < 5}
                mobileCompact
                kokoBranding={kokoBranding}
                kokoAvailable={kokoAvailable}
              />
            </div>
            <div className="hidden h-full medium:block">
              <BestSellingProductCard
                product={product}
                priority={index < 5}
                kokoBranding={kokoBranding}
                kokoAvailable={kokoAvailable}
              />
            </div>
          </div>
        ))}
      </div>

      {pageIndexes.length > 1 && (
        <div
          className="mt-2 flex items-center justify-center gap-3 medium:hidden"
          aria-label="Best selling products carousel pagination"
        >
          {pageIndexes.map((productIndex, index) => {
            const isActive = index === activeIndex

            return (
              <button
                key={`${visibleProducts[productIndex]?.id ?? productIndex}:${index}`}
                type="button"
                aria-label={`Show product ${index + 1} of ${
                  pageIndexes.length
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

function getCarouselCards(track: HTMLElement) {
  return Array.from(
    track.querySelectorAll<HTMLElement>("[data-best-selling-carousel-card]")
  )
}

export default BestSellingProductsCarousel
