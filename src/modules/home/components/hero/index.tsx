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
    <section className="w-full overflow-hidden bg-white pt-2 sm:pt-3">
      <div className="mx-0 w-full max-w-full overflow-hidden px-0 small:mx-auto small:w-[90%] small:max-w-[1440px]">
        <div
          className="relative isolate aspect-[16/9] min-h-[210px] overflow-hidden text-white xsmall:min-h-[230px] sm:aspect-[1839/710] sm:min-h-[300px] small:min-h-0"
          aria-roledescription="carousel"
          aria-label="Homepage featured banners"
        >
          <div
            className="absolute inset-0 z-10 overflow-hidden bg-black [--hero-mask-image:url(/images/homepagebanner-01.svg)] [--hero-mask-position:center_47.6%] [--hero-mask-size:156%_auto] sm:[--hero-mask-size:132%_auto] small:[--hero-mask-position:center_47.6%] small:[--hero-mask-size:104.5%_auto]"
            style={{
              WebkitMaskImage: "var(--hero-mask-image)",
              WebkitMaskSize: "var(--hero-mask-size)",
              WebkitMaskPosition: "var(--hero-mask-position)",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "var(--hero-mask-image)",
              maskSize: "var(--hero-mask-size)",
              maskPosition: "var(--hero-mask-position)",
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

                  <div className="relative z-20 flex h-full w-full max-w-full -translate-y-3 flex-col justify-center px-4 py-7 xsmall:px-5 sm:max-w-[720px] sm:-translate-y-2 sm:px-10 small:max-w-[920px] small:-translate-y-8 small:px-20 small:py-12 small:pl-[112px] xl:pl-[132px]">
                    <div className="mb-2.5 flex max-w-full flex-wrap items-center gap-1.5 text-[7px] leading-none xsmall:text-[8px] sm:mb-4 sm:flex-nowrap sm:gap-2.5 small:mb-6 small:gap-4 small:text-[13px]">
                      {slide.eyebrow && (
                        <span className="inline-flex h-5 max-w-full items-center rounded-full border border-[#ff5c0e] px-2 text-[7px] font-bold uppercase tracking-normal text-white xsmall:h-6 xsmall:text-[8px] small:h-[38px] small:px-6 small:text-[13px]">
                          {slide.eyebrow}
                        </span>
                      )}
                      {slide.subtitle && (
                        <>
                          <span className="hidden h-5 w-px bg-white sm:block small:h-6" />
                          <p className="min-w-0 max-w-full break-words text-[7px] font-bold leading-[10px] text-white xsmall:text-[8px] xsmall:leading-[11px] sm:whitespace-nowrap small:text-[13px] small:leading-[18px]">
                            {slide.subtitle}
                          </p>
                        </>
                      )}
                    </div>

                    <h1 className="max-w-[min(100%,280px)] break-words text-[15px] font-bold leading-[1.1] text-white xsmall:text-[16px] sm:max-w-[430px] sm:text-[22px] small:max-w-[560px] small:text-[40px]">
                      {renderHighlightedTitle(slide.title, slide.highlightText)}
                    </h1>

                    {slide.descriptionHtml && (
                      <div
                        className="mt-2.5 max-w-[min(100%,280px)] break-words text-[8px] leading-[11px] text-white/90 xsmall:text-[9px] xsmall:leading-[12px] sm:mt-3 sm:max-w-[360px] sm:text-[10px] sm:leading-[15px] small:mt-4 small:max-w-[410px] small:text-[13px] small:leading-[20px]"
                        dangerouslySetInnerHTML={{ __html: slide.descriptionHtml }}
                      />
                    )}

                    <div className="mt-3.5 flex max-w-full flex-wrap gap-2 sm:mt-4 sm:flex-nowrap small:mt-6 small:gap-5">
                      {slide.primaryLabel && slide.primaryUrl && (
                        <LocalizedClientLink
                          href={slide.primaryUrl}
                          className="inline-flex h-7 min-w-0 max-w-full items-center justify-center rounded-[6px] bg-[#ff5c0e] px-3 text-[8px] font-bold text-white transition-colors hover:bg-[#e6530c] xsmall:text-[9px] small:h-[43px] small:min-w-[174px] small:rounded-[7px] small:px-7 small:text-[13px]"
                        >
                          {slide.primaryLabel}
                          <span className="ml-2 text-sm leading-none small:ml-3 small:text-base" aria-hidden="true">
                            &rsaquo;
                          </span>
                        </LocalizedClientLink>
                      )}
                      {slide.secondaryLabel && slide.secondaryUrl && (
                        <LocalizedClientLink
                          href={slide.secondaryUrl}
                          className="inline-flex h-7 min-w-0 max-w-full items-center justify-center rounded-[6px] border border-white px-3 text-[8px] font-bold text-white transition-colors hover:bg-white hover:text-black xsmall:text-[9px] small:h-[43px] small:min-w-[198px] small:rounded-[7px] small:px-7 small:text-[13px]"
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

          <div className="absolute bottom-[3.6%] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 small:bottom-[4.4%] small:gap-4">
            {slides.map((slide, index) => (
              <button
                key={`${slide.title}-${index}`}
                type="button"
                className={`h-2.5 w-2.5 rounded-full border-0 p-0 transition-colors small:h-[13px] small:w-[13px] ${
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
