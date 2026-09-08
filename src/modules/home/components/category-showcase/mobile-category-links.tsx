"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

import type { ResolvedCategory } from "./index"

type MobileCategoryLinksProps = {
  categories: ResolvedCategory[]
}

const CATEGORIES_PER_PAGE = 2
const AUTO_ADVANCE_MS = 3500
const INTERACTION_PAUSE_MS = 8000

const MobileCategoryLinks = ({ categories }: MobileCategoryLinksProps) => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const resumeTimerRef = useRef<number | null>(null)
  const [activePage, setActivePage] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const pages = useMemo(() => chunkCategories(categories, CATEGORIES_PER_PAGE), [categories])
  const canAutoAdvance = pages.length > 1

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !canAutoAdvance) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.35 }
    )

    observer.observe(viewport)
    return () => observer.disconnect()
  }, [canAutoAdvance])

  useEffect(() => {
    if (!canAutoAdvance || !isVisible || isPaused || prefersReducedMotion()) {
      return
    }

    const interval = window.setInterval(() => {
      setActivePage((current) => {
        const next = current + 1 >= pages.length ? 0 : current + 1
        scrollToPage(next)
        return next
      })
    }, AUTO_ADVANCE_MS)

    return () => window.clearInterval(interval)
  }, [canAutoAdvance, isPaused, isVisible, pages.length])

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current)
      }
    }
  }, [])

  function scrollToPage(page: number) {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }
    viewport.scrollTo({
      left: viewport.clientWidth * page,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }

  function pauseAfterInteraction() {
    if (!canAutoAdvance) {
      return
    }
    setIsPaused(true)
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current)
    }
    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false)
      resumeTimerRef.current = null
    }, INTERACTION_PAUSE_MS)
  }

  function handleScroll() {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }
    const page = Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth))
    setActivePage(Math.min(pages.length - 1, Math.max(0, page)))
  }

  return (
    <div className="small:hidden">
      <div
        ref={viewportRef}
        className="no-scrollbar -mx-1 grid auto-cols-[100%] grid-flow-col overflow-x-auto scroll-smooth snap-x snap-mandatory scroll-px-1 px-1"
        aria-label="Category links"
        onPointerDown={pauseAfterInteraction}
        onFocusCapture={pauseAfterInteraction}
        onScroll={handleScroll}
      >
        {pages.map((page, pageIndex) => (
          <div
            key={pageIndex}
            className="grid w-full snap-start grid-cols-2 gap-x-4"
            aria-roledescription="slide"
            aria-label={`Category group ${pageIndex + 1} of ${pages.length}`}
          >
            {page.map((category) => (
              <LocalizedClientLink
                key={category.id}
                href={`/categories/${category.handle}`}
                className="group grid min-w-0 justify-items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <div className="relative flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-full border border-[#e5e7eb] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-all duration-300 group-hover:border-brand/50 group-hover:shadow-[0_10px_24px_rgba(255,92,14,0.12)]">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.image_alt || category.name}
                      fill
                      sizes="96px"
                      className="object-contain object-center p-3.5 transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="px-4 text-[26px] font-bold uppercase leading-none text-[#b8bac3]">
                      {categoryInitials(category.name)}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 line-clamp-2 min-h-[40px] text-[14px] font-bold leading-5 tracking-normal text-black transition-colors group-hover:text-brand">
                  {category.name}
                </h3>
              </LocalizedClientLink>
            ))}
          </div>
        ))}
      </div>

      {pages.length > 1 && (
        <div className="mt-5 flex justify-center gap-2" aria-label="Category link pages">
          {pages.map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              className={[
                "h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                pageIndex === activePage ? "w-5 bg-brand" : "w-2 bg-[#d4d7da]",
              ].join(" ")}
              aria-label={`Show category links ${pageIndex + 1}`}
              aria-current={pageIndex === activePage ? "true" : undefined}
              onClick={() => {
                pauseAfterInteraction()
                setActivePage(pageIndex)
                scrollToPage(pageIndex)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function chunkCategories(categories: ResolvedCategory[], size: number) {
  const chunks: ResolvedCategory[][] = []
  for (let index = 0; index < categories.length; index += size) {
    chunks.push(categories.slice(index, index + size))
  }
  return chunks
}

function categoryInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

export default MobileCategoryLinks
