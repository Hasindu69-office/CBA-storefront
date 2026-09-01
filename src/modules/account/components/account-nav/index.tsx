"use client"

import { clx } from "@medusajs/ui"
import {
  ArrowRightOnRectangle,
  ChatBubbleLeftRight,
  CodeCompare,
  CubeSolid,
  Heart,
  House,
  Lifebuoy,
  MapPin as MedusaMapPin,
  Receipt,
  User as MedusaUser,
} from "@medusajs/icons"
import { useParams, usePathname } from "next/navigation"

import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"
import { getStoreCountryCode, stripCountryCodeFromPath } from "@lib/util/routes"
import type { ComponentType, ReactNode } from "react"

const primaryAccountLinks = [
  {
    href: "/account",
    label: "Dashboard",
    shortLabel: "Overview",
    testId: "overview-link",
    icon: House,
  },
  {
    href: "/account/orders",
    label: "Orders",
    testId: "orders-link",
    icon: CubeSolid,
  },
  {
    href: "/account/returns",
    label: "Returns",
    testId: "returns-link",
    icon: Package,
  },
  {
    href: "/account/invoices",
    label: "Invoices",
    testId: "invoices-link",
    icon: Receipt,
  },
  {
    href: "/account/support",
    label: "Support Tickets",
    shortLabel: "Support",
    testId: "support-link",
    icon: ChatBubbleLeftRight,
  },
]

const secondaryAccountLinks = [
  {
    href: "/wishlist",
    label: "Wishlist",
    testId: "wishlist-link",
    icon: Heart,
  },
  {
    href: "/compare",
    label: "Compare",
    testId: "compare-link",
    icon: CodeCompare,
  },
  {
    href: "/account/addresses",
    label: "Addresses",
    testId: "addresses-link",
    icon: MedusaMapPin,
  },
  {
    href: "/account/profile",
    label: "Account Details",
    shortLabel: "Profile",
    testId: "profile-link",
    icon: MedusaUser,
  },
]

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  return (
    <div className="contents small:block small:h-full">
      <div className="small:hidden" data-testid="mobile-account-nav">
        <div className="mb-3 px-1">
          <p className="text-xsmall-regular uppercase tracking-[0.08em] text-gray-500">
            Account
          </p>
          <h2 className="mt-1 text-[26px] font-bold leading-tight text-gray-950">
            Hello {customer?.first_name || "there"}
          </h2>
        </div>
        <nav
          className="border-y border-gray-100 bg-white px-4 py-3 shadow-sm"
          aria-label="Account sections"
        >
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[...primaryAccountLinks, ...secondaryAccountLinks].map((link) => (
              <MobileAccountNavLink
                key={link.href}
                href={link.href}
                route={route!}
                data-testid={link.testId}
                icon={link.icon}
              >
                {link.shortLabel ?? link.label}
              </MobileAccountNavLink>
            ))}
            <button
              type="button"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-2 text-[13px] font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <ArrowRightOnRectangle className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </nav>
      </div>
      <aside
        className="hidden min-h-full flex-col border-r border-gray-100 bg-white px-4 py-5 shadow-[1px_0_0_rgba(15,23,42,0.02)] small:flex"
        data-testid="account-nav"
      >
        <nav className="flex-1" aria-label="Account sections">
          <ul className="mb-0 flex flex-col gap-1">
            {[...primaryAccountLinks, ...secondaryAccountLinks].map((link) => (
              <li key={link.href}>
                <AccountNavLink
                  href={link.href}
                  route={route!}
                  data-testid={link.testId}
                  icon={link.icon}
                >
                  {link.label}
                </AccountNavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <LocalizedClientLink
            href="/account/support"
            className="rounded-lg border border-gray-200 bg-[#fbfcfd] p-4 transition-colors hover:border-[#ff5c0e]/40 hover:bg-orange-50/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-[#ff5c0e]">
              <Lifebuoy className="h-6 w-6" />
            </span>
            <p className="mt-3 text-small-semi text-gray-950">Need Help?</p>
            <p className="mt-2 text-small-regular leading-5 text-gray-600">
              Our support team is here to help you.
            </p>
            <span className="mt-4 flex min-h-10 items-center justify-center rounded-md border border-[#ff5c0e]/40 bg-white px-3 text-small-semi text-[#ff5c0e]">
              Contact Support
            </span>
          </LocalizedClientLink>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-left text-small-semi text-gray-600 transition-colors hover:border-gray-100 hover:bg-gray-50 hover:text-gray-950"
            data-testid="logout-button"
          >
            <ArrowRightOnRectangle className="h-5 w-5 text-gray-500" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </div>
  )
}

const MobileAccountNavLink = ({
  href,
  route,
  children,
  icon: Icon,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()
  const currentCountryCode = getStoreCountryCode(countryCode)
  const currentRoute = stripCountryCodeFromPath(route, currentCountryCode)
  const active = isActiveAccountRoute(currentRoute, href)

  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors",
        active
          ? "border-[#ff5c0e] bg-orange-50 text-[#ff5c0e]"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
      )}
      data-testid={dataTestId}
      aria-current={active ? "page" : undefined}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span>{children}</span>
    </LocalizedClientLink>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: ReactNode
  icon?: ComponentType<{ className?: string }>
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  icon: Icon,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()
  const currentCountryCode = getStoreCountryCode(countryCode)
  const currentRoute = stripCountryCodeFromPath(route, currentCountryCode)

  const active = isActiveAccountRoute(currentRoute, href)
  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-small-semi text-gray-600 transition-colors hover:border-gray-100 hover:bg-gray-50 hover:text-gray-950",
        {
          "border-orange-100 bg-orange-50 text-[#ff5c0e] shadow-[0_1px_8px_rgba(255,92,14,0.08)] hover:border-orange-100 hover:bg-orange-50 hover:text-[#ff5c0e]":
            active,
        }
      )}
      data-testid={dataTestId}
      aria-current={active ? "page" : undefined}
    >
      {Icon && (
        <Icon
          className={clx(
            "h-5 w-5 shrink-0",
            active ? "text-[#ff5c0e]" : "text-gray-500"
          )}
        />
      )}
      <span>{children}</span>
    </LocalizedClientLink>
  )
}

function isActiveAccountRoute(currentRoute: string, href: string) {
  if (currentRoute === href) {
    return true
  }

  if (href === "/account") {
    return false
  }

  return currentRoute.startsWith(`${href}/`)
}

export default AccountNav
