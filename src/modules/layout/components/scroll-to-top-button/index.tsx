"use client"

import { ChevronDownIcon } from "@modules/layout/components/cba-icons"
import { useEffect, useState } from "react"

const SHOW_AFTER_PX = 420

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [chatbotOpen, setChatbotOpen] = useState(false)

  useEffect(() => {
    let frameId: number | null = null

    const updateVisibility = () => {
      frameId = null
      setIsVisible(window.scrollY > SHOW_AFTER_PX)
    }

    const onScroll = () => {
      if (frameId !== null) {
        return
      }

      frameId = window.requestAnimationFrame(updateVisibility)
    }

    updateVisibility()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  useEffect(() => {
    const onVisibility = (event: Event) => setChatbotOpen(Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open))
    window.addEventListener("cba:chatbot-visibility", onVisibility)
    return () => window.removeEventListener("cba:chatbot-visibility", onVisibility)
  }, [])

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 text-brand shadow-[0_8px_24px_rgba(17,24,39,0.14),0_2px_6px_rgba(17,24,39,0.08)] backdrop-blur transition-[transform,opacity,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_28px_rgba(17,24,39,0.18),0_2px_8px_rgba(17,24,39,0.10)] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 motion-reduce:transform-none ${
        isVisible && !chatbotOpen
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ChevronDownIcon size={21} strokeWidth={2.2} className="rotate-180" />
    </button>
  )
}
