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
      className="bg-white pt-8 pb-12 xsmall:pb-14 md:pb-16 small:py-10"
      aria-labelledby="category-slider-title"
    >
      <div className="content-container">
        <div className="mb-6 flex items-start justify-between gap-6 sm:mb-7 small:mb-9">
          <div className="min-w-0">
            <h2
              id="category-slider-title"
              className="text-[24px] font-bold leading-[1.15] tracking-normal text-black xsmall:text-[26px] small:text-[30px]"
            >
              Shop by Category
            </h2>
            <div className="mt-3 h-px w-[180px] bg-[#cfcfcf] xsmall:w-[205px] small:w-[250px]" />
          </div>
          <LocalizedClientLink
            href="/store"
            className="hidden h-9 min-w-[154px] items-center justify-center rounded border border-[#dedee5] bg-white px-5 text-[12px] font-medium text-[#222222] transition-colors hover:border-brand hover:text-brand small:flex"
          >
            View All Categories
          </LocalizedClientLink>
        </div>

        <div
          ref={scrollerRef}
          className="no-scrollbar grid auto-cols-[minmax(248px,82vw)] grid-flow-col gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scroll-px-0 pb-3 pr-4 xsmall:auto-cols-[minmax(280px,72vw)] sm:auto-cols-[minmax(300px,46vw)] md:auto-cols-[calc((100%_-_20px)_/_2)] md:gap-5 md:pr-1 small:auto-cols-[calc((100%_-_20px)_/_2)] medium:auto-cols-[calc((100%_-_60px)_/_4)]"
        >
          {categories.map((category, index) => (
            <LocalizedClientLink
              key={category.id}
              href={`/categories/${category.handle}`}
              data-category-card
              className="group relative flex h-[316px] w-full min-w-0 snap-start overflow-hidden rounded-[8px] border border-transparent bg-white px-4 pb-5 pt-0 transition-colors hover:border-brand/40 xsmall:h-[336px] xsmall:px-5 sm:h-[348px] md:h-[360px] medium:h-[382px]"
              style={{
                backgroundImage: `url("${category.background.url}")`,
                backgroundSize: "100% 92%",
                backgroundPosition: "center bottom",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="absolute inset-0 bg-white/10" />
              <div className="relative z-10 flex h-full w-full flex-col justify-between">
                <div className="relative mx-auto -mt-1 h-[196px] w-full flex-shrink-0 xsmall:h-[214px] sm:h-[226px] md:h-[238px] medium:h-[252px]">
                  <Image
                    src={category.image.url}
                    alt={category.image.alt}
                    fill
                    priority={index < 4}
                    sizes="(min-width: 1280px) 282px, (min-width: 1024px) 45vw, (min-width: 768px) 42vw, 82vw"
                    className="object-contain object-top transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="min-h-[66px] px-1 pb-0 xsmall:px-2 small:px-3">
                  <h3 className="line-clamp-1 text-[14px] font-bold leading-5 tracking-normal text-black xsmall:text-[15px] small:text-[17px]">
                    {category.name}
                  </h3>
                  <div className="mt-1 min-h-[34px]">
                    <p className="line-clamp-2 text-[11px] leading-[16px] tracking-normal text-black xsmall:text-[12px] xsmall:leading-[17px] small:text-[13px]">
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
          className="mt-6 flex h-10 items-center justify-center rounded border border-[#dedee5] bg-white px-5 text-[13px] font-medium text-[#222222] transition-colors hover:border-brand hover:text-brand small:hidden"
        >
          View All Categories
        </LocalizedClientLink>
      </div>
    </section>
  )
}

export default CategorySlider
