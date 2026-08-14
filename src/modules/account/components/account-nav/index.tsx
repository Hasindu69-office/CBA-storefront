"use client"

import { clx } from "@medusajs/ui"
import {
  ArrowRightOnRectangle,
  CodeCompare,
  CubeSolid,
  Heart,
  House,
  MapPin as MedusaMapPin,
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
    icon: Package,
  },
  {
    href: "/account/support",
    label: "Support",
    testId: "support-link",
    icon: Package,
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
    <div className="contents small:block">
      <div className="small:hidden" data-testid="mobile-account-nav">
        <div className="mb-3 text-[26px] font-bold leading-tight text-gray-950">
          Hello {customer?.first_name}
        </div>
        <nav
          className="-mx-4 border-y border-gray-100 bg-white px-4 py-2 shadow-sm"
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
      <div className="hidden small:block" data-testid="account-nav">
        <div className="mr-5 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="text-base-regular">
            <ul className="flex mb-0 justify-start items-start flex-col gap-y-1">
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
              <li className="w-full pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-small-semi text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950"
                  data-testid="logout-button"
                >
                  <ArrowRightOnRectangle className="h-5 w-5 text-gray-500" />
                  <span>Log out</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
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
  const active = currentRoute === href

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

  const active = currentRoute === href
  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-small-semi text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950",
        {
          "bg-orange-50 text-[#ff5c0e] hover:bg-orange-50 hover:text-[#ff5c0e]":
            active,
        }
      )}
      data-testid={dataTestId}
    >
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
      <span>{children}</span>
    </LocalizedClientLink>
  )
}

export default AccountNav
