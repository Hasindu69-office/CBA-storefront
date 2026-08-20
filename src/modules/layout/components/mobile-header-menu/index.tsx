"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  LayoutGridIcon,
  MenuIcon,
  XIcon,
} from "@modules/layout/components/cba-icons"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export type MobileHeaderLink = {
  label: string
  href: string
}

type MobileHeaderMenuProps = {
  primaryLinks: MobileHeaderLink[]
  categoryLinks: MobileHeaderLink[]
  logo: {
    imageUrl: string
    altText: string
  }
  variant?: "hamburger" | "categories" | "bottom-categories"
  active?: boolean
}

type MobileMenuTab = "menu" | "categories"

export default function MobileHeaderMenu({
  primaryLinks,
  categoryLinks,
  logo,
  variant = "hamburger",
  active = false,
}: MobileHeaderMenuProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MobileMenuTab>("menu")
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const openMenu = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
    }
    setActiveTab(
      variant === "categories" || variant === "bottom-categories"
        ? "categories"
        : "menu"
    )
    setIsMounted(true)
    window.requestAnimationFrame(() => setIsOpen(true))
  }

  const closeMenu = () => {
    setIsOpen(false)
    closeTimerRef.current = window.setTimeout(() => {
      setIsMounted(false)
    }, 300)
  }

  const menuOverlay = isMounted ? (
    <div className="fixed inset-0 z-[100] small:hidden">
      <button
        type="button"
        className={`absolute inset-0 h-full w-full bg-black/45 transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close navigation menu"
        onClick={closeMenu}
      />
      <aside
        className={`relative flex h-[100dvh] max-h-[100dvh] w-[min(86vw,360px)] flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300 ease-out will-change-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        <div className="relative flex min-h-[76px] items-center justify-center border-b border-gray-100 px-14 py-4">
          <Image
            src={logo.imageUrl}
            alt={logo.altText}
            width={244}
            height={104}
            className="h-auto w-[136px]"
            priority={false}
          />
          <button
            type="button"
            onClick={closeMenu}
            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-black transition hover:bg-gray-50"
            aria-label="Close navigation menu"
          >
            <XIcon size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="relative grid grid-cols-2 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setActiveTab("menu")}
            className={`h-12 text-[14px] font-bold transition-colors duration-200 ${
              activeTab === "menu" ? "text-brand" : "text-[#596070]"
            }`}
          >
            Main Menu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`h-12 text-[14px] font-bold transition-colors duration-200 ${
              activeTab === "categories" ? "text-brand" : "text-[#596070]"
            }`}
          >
            Categories
          </button>
          <span
            className={`absolute bottom-0 left-0 h-0.5 w-1/2 bg-brand transition-transform duration-300 ease-out ${
              activeTab === "categories" ? "translate-x-full" : "translate-x-0"
            }`}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div
            className={`flex h-full w-[200%] transition-transform duration-300 ease-out ${
              activeTab === "categories"
                ? "-translate-x-1/2"
                : "translate-x-0"
            }`}
          >
            <MobileMenuLinkPanel links={primaryLinks} onNavigate={closeMenu} />
            <MobileMenuLinkPanel links={categoryLinks} onNavigate={closeMenu} />
          </div>
        </div>

      </aside>
    </div>
  ) : null

  return (
    <>
      {variant === "categories" ? (
        <button
          type="button"
          onClick={openMenu}
          className="flex h-full w-full items-center justify-center gap-2 px-3 text-[14px] font-bold text-[#111827] xsmall:text-[15px]"
          aria-label="Open all categories"
          aria-expanded={isOpen}
        >
          <LayoutGridIcon size={18} strokeWidth={2} />
          <span>All Categories</span>
        </button>
      ) : variant === "bottom-categories" ? (
        <button
          type="button"
          onClick={openMenu}
          className={`group flex h-full min-h-[58px] w-full flex-col items-center justify-center gap-1.5 px-1 text-[11px] font-bold leading-none transition-colors xsmall:text-[12px] ${
            active ? "text-brand" : "text-[#596070] hover:text-[#111827]"
          }`}
          aria-label="Open categories"
          aria-expanded={isOpen}
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              active ? "bg-brand/10" : "group-hover:bg-gray-50"
            }`}
          >
            <LayoutGridIcon size={22} strokeWidth={2} />
          </span>
          <span className="max-w-full truncate">Categories</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={openMenu}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-black transition hover:bg-gray-50 small:hidden"
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
        >
          <MenuIcon size={27} strokeWidth={2.1} />
        </button>
      )}

      {menuOverlay ? createPortal(menuOverlay, document.body) : null}
    </>
  )
}

function MobileMenuLinkPanel({
  links,
  onNavigate,
}: {
  links: MobileHeaderLink[]
  onNavigate: () => void
}) {
  return (
    <nav className="h-full w-1/2 overflow-y-auto px-5 py-3">
      <ul className="divide-y divide-gray-100">
        {links.map((link) => (
          <li key={link.label}>
            <LocalizedClientLink
              href={link.href}
              onClick={onNavigate}
              className="flex min-h-12 items-center py-3 text-[15px] font-semibold text-[#111827] transition hover:text-brand"
            >
              <span>{link.label}</span>
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
