"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

import type { CategorySliderItem } from "@lib/data/category-slider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CategorySliderProps = {
  categories: CategorySliderItem[]
}

const CategorySlider = ({ categories }: CategorySliderProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (categories.length < 2) {
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

      const firstCard = scroller.querySelector<HTMLElement>("[data-category-card]")
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
  }, [categories.length])

  if (!categories.length) {
    return null
  }

  return (
    <section
      id="home-categories"
      className="bg-white py-10 small:py-14"
      aria-labelledby="category-slider-title"
    >
      <div className="content-container">
        <div className="mb-11 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h2
              id="category-slider-title"
              className="text-[30px] font-bold leading-[1.15] tracking-normal text-black small:text-[34px]"
            >
              Shop by Category
            </h2>
            <div className="mt-4 h-px w-[220px] bg-[#cfcfcf] small:w-[295px]" />
          </div>
          <LocalizedClientLink
            href="/store"
            className="hidden h-11 min-w-[174px] items-center justify-center rounded border border-[#dedee5] bg-white px-6 text-[14px] font-semibold text-[#333333] transition-colors hover:border-brand hover:text-brand small:flex"
          >
            View All Categories
          </LocalizedClientLink>
        </div>

        <div
          ref={scrollerRef}
          className="no-scrollbar grid auto-cols-[minmax(272px,calc(100vw_-_48px))] grid-flow-col gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory scroll-px-0 pb-2 pr-1 small:auto-cols-[calc((100%_-_20px)_/_2)] medium:auto-cols-[calc((100%_-_60px)_/_4)]"
        >
          {categories.map((category, index) => (
            <LocalizedClientLink
              key={category.id}
              href={`/categories/${category.handle}`}
              data-category-card
              className="group relative flex h-[405px] w-full min-w-0 snap-start overflow-hidden rounded-[14px] border border-transparent bg-white p-6 pt-0 transition-colors hover:border-brand/40 small:h-[424px] medium:h-[432px]"
              style={{
                backgroundImage: `url("${category.background.url}")`,
                backgroundSize: "100% 100%",
                backgroundPosition: "center bottom",
              }}
            >
              <div className="absolute inset-0 bg-white/10" />
              <div className="relative z-10 flex h-full w-full flex-col justify-between">
                <div className="relative mx-auto h-[276px] w-full flex-shrink-0 small:h-[294px] medium:h-[300px]">
                  <Image
                    src={category.image.url}
                    alt={category.image.alt}
                    fill
                    priority={index < 4}
                    sizes="(min-width: 1280px) 282px, (min-width: 1024px) 45vw, calc(100vw - 96px)"
                    className="object-contain object-center transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="min-h-[86px] pb-1">
                  <h3 className="line-clamp-1 text-[22px] font-bold leading-7 tracking-normal text-black">
                    {category.name}
                  </h3>
                  <div className="mt-2 min-h-[44px]">
                    <p className="line-clamp-2 text-[15px] leading-[22px] tracking-normal text-black">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            </LocalizedClientLink>
          ))}
        </div>

        <LocalizedClientLink
          href="/store"
          className="mt-7 flex h-11 items-center justify-center rounded border border-[#dedee5] bg-white px-6 text-[14px] font-semibold text-[#333333] transition-colors hover:border-brand hover:text-brand small:hidden"
        >
          View All Categories
        </LocalizedClientLink>
      </div>
    </section>
  )
}

export default CategorySlider
