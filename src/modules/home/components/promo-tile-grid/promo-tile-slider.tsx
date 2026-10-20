"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

type PromoTileSliderProps = {
  children: ReactNode
  autoAdvanceMs?: number
}

const AUTO_ADVANCE_MS = 5000

export default function PromoTileSlider({
  children,
  autoAdvanceMs = AUTO_ADVANCE_MS,
}: PromoTileSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || typeof window === "undefined") {
      return
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    )
    if (prefersReducedMotion.matches) {
      return
    }

    const interval = window.setInterval(() => {
      const track = trackRef.current
      if (!track) {
        return
      }

      const maxScrollLeft = track.scrollWidth - track.clientWidth
      if (maxScrollLeft <= 1) {
        return
      }

      if (track.scrollLeft >= maxScrollLeft - 1) {
        track.scrollTo({ left: 0, behavior: "smooth" })
        return
      }

      track.scrollBy({ left: track.clientWidth, behavior: "smooth" })
    }, autoAdvanceMs)

    return () => window.clearInterval(interval)
  }, [autoAdvanceMs, paused])

  return (
    <div
      ref={trackRef}
      className="no-scrollbar flex w-full gap-4 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory pb-1 sm:gap-5 medium:hidden"
      aria-label="Homepage product promotions slider"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      {children}
    </div>
  )
}
