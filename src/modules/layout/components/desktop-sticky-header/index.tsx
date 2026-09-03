"use client"

import { ReactNode, useEffect, useRef, useState } from "react"

const DESKTOP_HEADER_MEDIA_QUERY = "(min-width: 1024px)"

type DesktopStickyHeaderProps = {
  children: ReactNode
}

export default function DesktopStickyHeader({
  children,
}: DesktopStickyHeaderProps) {
  const markerRef = useRef<HTMLDivElement>(null)
  const thresholdRef = useRef(0)
  const fixedRef = useRef(false)
  const frameRef = useRef<number | null>(null)
  const [isFixed, setIsFixed] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_HEADER_MEDIA_QUERY)

    function update() {
      frameRef.current = null

      const marker = markerRef.current
      if (!marker) {
        return
      }

      thresholdRef.current = marker.getBoundingClientRect().top + window.scrollY

      const shouldFix =
        mediaQuery.matches && window.scrollY >= thresholdRef.current

      if (shouldFix !== fixedRef.current) {
        fixedRef.current = shouldFix
        setIsFixed(shouldFix)
      }
    }

    function scheduleUpdate() {
      if (frameRef.current !== null) {
        return
      }

      frameRef.current = window.requestAnimationFrame(update)
    }

    scheduleUpdate()
    window.addEventListener("scroll", scheduleUpdate, { passive: true })
    window.addEventListener("resize", scheduleUpdate)
    mediaQuery.addEventListener?.("change", scheduleUpdate)

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }

      window.removeEventListener("scroll", scheduleUpdate)
      window.removeEventListener("resize", scheduleUpdate)
      mediaQuery.removeEventListener?.("change", scheduleUpdate)
    }
  }, [])

  return (
    <>
      <div ref={markerRef} aria-hidden="true" className="hidden small:block" />
      <div
        aria-hidden={!isFixed}
        className={[
          "fixed left-0 right-0 top-0 z-[70] hidden border-b border-gray-100 bg-white/95 py-2 shadow-[0_8px_24px_rgba(17,24,39,0.08)] backdrop-blur transition-[transform,opacity,visibility] duration-300 ease-out small:block",
          isFixed
            ? "visible pointer-events-auto translate-y-0 opacity-100"
            : "invisible pointer-events-none -translate-y-full opacity-0",
        ].join(" ")}
      >
        {children}
      </div>
    </>
  )
}
