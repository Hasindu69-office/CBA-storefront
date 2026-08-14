"use client"

import { openSideCart } from "@lib/util/side-cart-event"
import { stripCountryCodeFromPath } from "@lib/util/routes"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  HomeIcon,
  ShoppingCartIcon,
  StoreIcon,
  UserIcon,
} from "@modules/layout/components/cba-icons"
import MobileHeaderMenu, {
  MobileHeaderLink,
} from "@modules/layout/components/mobile-header-menu"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

type MobileBottomNavProps = {
  cart?: HttpTypes.StoreCart | null
  primaryLinks: MobileHeaderLink[]
  categoryLinks: MobileHeaderLink[]
  logo: {
    imageUrl: string
    altText: string
  }
}

function getItemCount(cart?: HttpTypes.StoreCart | null) {
  return cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
}

function isActivePath(pathname: string, href: string) {
  const normalizedPathname = stripCountryCodeFromPath(pathname)

  if (href === "/") {
    return normalizedPathname === "/"
  }

  return normalizedPathname === href || normalizedPathname.startsWith(`${href}/`)
}

function BottomNavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string
  label: string
  icon: ReactNode
  active: boolean
}) {
  return (
    <LocalizedClientLink
      href={href}
      className={`group flex min-h-[58px] flex-col items-center justify-center gap-1.5 px-1 text-[11px] font-bold leading-none transition-colors xsmall:text-[12px] ${
        active ? "text-brand" : "text-[#596070] hover:text-[#111827]"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          active ? "bg-brand/10" : "group-hover:bg-gray-50"
        }`}
      >
        {icon}
      </span>
      <span className="max-w-full truncate">{label}</span>
    </LocalizedClientLink>
  )
}

export default function MobileBottomNav({
  cart,
  primaryLinks,
  categoryLinks,
  logo,
}: MobileBottomNavProps) {
  const pathname = stripCountryCodeFromPath(usePathname())
  const itemCount = getItemCount(cart)
  const categoriesActive = pathname.startsWith("/categories")
  const cartActive = isActivePath(pathname, "/cart") || pathname.startsWith("/checkout")

  return (
    <nav
      className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-3 right-3 z-40 overflow-hidden rounded-[32px] border border-white/80 bg-white/95 shadow-[0_14px_40px_rgba(17,24,39,0.22),0_3px_10px_rgba(17,24,39,0.10)] backdrop-blur small:hidden xsmall:left-4 xsmall:right-4"
      aria-label="Mobile primary navigation"
    >
      <div className="grid min-h-[66px] grid-cols-5 items-stretch px-2 py-1.5">
        <BottomNavLink
          href="/"
          label="Home"
          icon={<HomeIcon size={22} strokeWidth={2} />}
          active={isActivePath(pathname, "/")}
        />
        <BottomNavLink
          href="/store"
          label="Shop"
          icon={<StoreIcon size={22} strokeWidth={2} />}
          active={isActivePath(pathname, "/store")}
        />
        <MobileHeaderMenu
          primaryLinks={primaryLinks}
          categoryLinks={categoryLinks}
          logo={logo}
          variant="bottom-categories"
          active={categoriesActive}
        />
        <BottomNavLink
          href="/account"
          label="Account"
          icon={<UserIcon size={22} strokeWidth={2} />}
          active={isActivePath(pathname, "/account")}
        />
        <button
          type="button"
          onClick={() => openSideCart({ refresh: true })}
          className={`group flex min-h-[58px] flex-col items-center justify-center gap-1.5 px-1 text-[11px] font-bold leading-none transition-colors xsmall:text-[12px] ${
            cartActive ? "text-brand" : "text-[#596070] hover:text-[#111827]"
          }`}
          aria-label={`Open cart with ${itemCount} ${
            itemCount === 1 ? "item" : "items"
          }`}
          aria-current={cartActive ? "page" : undefined}
        >
          <span
            className={`relative flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              cartActive ? "bg-brand/10" : "group-hover:bg-gray-50"
            }`}
          >
            <ShoppingCartIcon size={22} strokeWidth={2} />
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white">
              {itemCount}
            </span>
          </span>
          <span className="max-w-full truncate">Cart</span>
        </button>
      </div>
    </nav>
  )
}
