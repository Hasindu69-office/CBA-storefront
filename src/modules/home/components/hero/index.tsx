"use client"

import type { HomepageCmsSection } from "@lib/data/homepage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useEffect, useMemo, useState } from "react"

type HeroProps = {
  sections: HomepageCmsSection[]
}

type HeroSlide = {
  title: string
  highlightText: string
  eyebrow: string
  subtitle: string
  descriptionHtml: string
  imageUrl: string
  imageAlt: string
  primaryLabel: string
  primaryUrl: string
  secondaryLabel: string
  secondaryUrl: string
}

const FALLBACK_SLIDE: HeroSlide = {
  title: "Powering Business with Smart Solutions",
  highlightText: "Smart Solutions",
  eyebrow: "NEW ARRIVALS",
  subtitle: "Trusted Technology. Reliable Performance.",
  descriptionHtml:
    "<p>Explore our premium range of office, retail and security technology built to streamline your operations and drive growth.</p>",
  imageUrl: "/images/bannerimage1.png",
  imageAlt: "CBA office technology banner with printers, scanner, payment terminal and security camera",
  primaryLabel: "Shop Now",
  primaryUrl: "/store",
  secondaryLabel: "Explore Categories",
  secondaryUrl: "#home-categories",
}

const DEFAULT_INTERVAL_MS = 6000
const MIN_INTERVAL_MS = 3000
const MAX_INTERVAL_MS = 15000

const Hero = ({ sections }: HeroProps) => {
  const heroSection = useMemo(
    () =>
      sections
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .find((section) => section.type === "hero_slider"),
    [sections]
  )
  const slides = useMemo(() => normalizeSlides(heroSection), [heroSection])
  const [activeIndex, setActiveIndex] = useState(0)

  const autoplay = heroSection?.config?.autoplay !== false && slides.length > 1
  const intervalMs = normalizeInterval(heroSection?.config?.interval_ms)

  useEffect(() => {
    setActiveIndex(0)
  }, [slides.length])

  useEffect(() => {
    if (!autoplay) {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mediaQuery.matches) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [autoplay, intervalMs, slides.length])

  return (
    <section className="w-full bg-white pt-2 sm:pt-3">
      <div className="content-container">
        <div
          className="relative isolate aspect-[1839/710] min-h-[430px] overflow-visible text-white sm:min-h-[450px] lg:min-h-0"
          aria-roledescription="carousel"
          aria-label="Homepage featured banners"
        >
          <div
            className="absolute inset-0 z-10 overflow-hidden bg-black"
            style={{
              WebkitMaskImage: "url('/images/homepagebanner-01.svg')",
              WebkitMaskSize: "104.5% auto",
              WebkitMaskPosition: "center 47.6%",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url('/images/homepagebanner-01.svg')",
              maskSize: "104.5% auto",
              maskPosition: "center 47.6%",
              maskRepeat: "no-repeat",
            }}
          >
            <div
              className="flex h-full transition-transform duration-700 ease-in-out motion-reduce:transition-none"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div
                  key={`${slide.title}-${index}`}
                  className="relative h-full w-full flex-none"
                  aria-hidden={index !== activeIndex}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.imageAlt}
                    className="absolute inset-0 z-0 h-full w-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 z-10 bg-gradient-to-r from-black via-black/55 to-transparent" />

                  <div className="relative z-20 flex h-full w-full max-w-[920px] -translate-y-8 flex-col justify-center px-8 py-12 sm:px-20 lg:pl-[112px] xl:pl-[132px]">
                    <div className="mb-6 flex flex-wrap items-center gap-4 text-[13px] leading-none sm:flex-nowrap">
                      {slide.eyebrow && (
                        <span className="inline-flex h-[38px] items-center rounded-full border border-[#ff5c0e] px-6 text-[13px] font-bold uppercase tracking-normal text-white">
                          {slide.eyebrow}
                        </span>
                      )}
                      {slide.subtitle && (
                        <>
                          <span className="hidden h-6 w-px bg-white sm:block" />
                          <p className="text-[13px] font-bold leading-[18px] text-white sm:whitespace-nowrap">
                            {slide.subtitle}
                          </p>
                        </>
                      )}
                    </div>

                    <h1 className="max-w-[560px] text-[34px] font-bold leading-[1.25] text-white sm:text-[40px]">
                      {renderHighlightedTitle(slide.title, slide.highlightText)}
                    </h1>

                    {slide.descriptionHtml && (
                      <div
                        className="mt-4 max-w-[410px] text-[13px] leading-[20px] text-white/90"
                        dangerouslySetInnerHTML={{ __html: slide.descriptionHtml }}
                      />
                    )}

                    <div className="mt-6 flex flex-wrap gap-5 sm:flex-nowrap">
                      {slide.primaryLabel && slide.primaryUrl && (
                        <LocalizedClientLink
                          href={slide.primaryUrl}
                          className="inline-flex h-[43px] min-w-[174px] items-center justify-center rounded-[7px] bg-[#ff5c0e] px-7 text-[13px] font-bold text-white transition-colors hover:bg-[#e6530c]"
                        >
                          {slide.primaryLabel}
                          <span className="ml-3 text-base leading-none" aria-hidden="true">
                            &rsaquo;
                          </span>
                        </LocalizedClientLink>
                      )}
                      {slide.secondaryLabel && slide.secondaryUrl && (
                        <LocalizedClientLink
                          href={slide.secondaryUrl}
                          className="inline-flex h-[43px] min-w-[198px] items-center justify-center rounded-[7px] border border-white px-7 text-[13px] font-bold text-white transition-colors hover:bg-white hover:text-black"
                        >
                          {slide.secondaryLabel}
                        </LocalizedClientLink>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-[4.4%] left-1/2 z-30 flex -translate-x-1/2 items-center gap-4">
            {slides.map((slide, index) => (
              <button
                key={`${slide.title}-${index}`}
                type="button"
                className={`h-[13px] w-[13px] rounded-full border-0 p-0 transition-colors ${
                  index === activeIndex ? "bg-[#ff5c0e]" : "bg-[#d4d7da]"
                }`}
                aria-label={`Show banner ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function normalizeSlides(section?: HomepageCmsSection): HeroSlide[] {
  const items = section?.items
    ?.slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => {
      const config = item.config ?? {}
      const imageUrl = item.media?.url ?? item.media_url ?? ""

      return {
        title: item.title?.trim() || FALLBACK_SLIDE.title,
        highlightText: textConfig(config.highlight_text) || FALLBACK_SLIDE.highlightText,
        eyebrow: textConfig(config.badge_label) || FALLBACK_SLIDE.eyebrow,
        subtitle: item.subtitle?.trim() || FALLBACK_SLIDE.subtitle,
        descriptionHtml: item.body_html?.trim() || FALLBACK_SLIDE.descriptionHtml,
        imageUrl: imageUrl || FALLBACK_SLIDE.imageUrl,
        imageAlt:
          item.media?.alt_text?.trim() ||
          item.media_alt_text?.trim() ||
          FALLBACK_SLIDE.imageAlt,
        primaryLabel: textConfig(config.cta_label) || FALLBACK_SLIDE.primaryLabel,
        primaryUrl: item.url?.trim() || FALLBACK_SLIDE.primaryUrl,
        secondaryLabel:
          textConfig(config.secondary_cta_label) || FALLBACK_SLIDE.secondaryLabel,
        secondaryUrl:
          textConfig(config.secondary_cta_url) || FALLBACK_SLIDE.secondaryUrl,
      }
    })
    .filter((slide) => slide.imageUrl)

  return items?.length ? items : [FALLBACK_SLIDE]
}

function textConfig(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeInterval(value: unknown) {
  const parsed = Number(value ?? DEFAULT_INTERVAL_MS)
  if (
    !Number.isInteger(parsed) ||
    parsed < MIN_INTERVAL_MS ||
    parsed > MAX_INTERVAL_MS
  ) {
    return DEFAULT_INTERVAL_MS
  }
  return parsed
}

function renderHighlightedTitle(title: string, highlightText: string) {
  if (!highlightText || !title.includes(highlightText)) {
    return title
  }

  const start = title.indexOf(highlightText)
  const before = title.slice(0, start)
  const after = title.slice(start + highlightText.length)
  const beforeWithoutJoiner = before.replace(/\s+with\s*$/i, "")

  if (beforeWithoutJoiner !== before) {
    return (
      <>
        <span className="block">{beforeWithoutJoiner}</span>
        <span className="block">
          with <span className="text-[#ff5c0e]">{highlightText}</span>
          {after}
        </span>
      </>
    )
  }

  return (
    <>
      {before}
      <span className="text-[#ff5c0e]">{highlightText}</span>
      {after}
    </>
  )
}

export default Hero
