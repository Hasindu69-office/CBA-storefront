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

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"
import { getStoreCountryCode, stripCountryCodeFromPath } from "@lib/util/routes"
import type { ComponentType, ReactNode } from "react"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }
  const accountRoute = stripCountryCodeFromPath(route, countryCode)

  const handleLogout = async () => {
    await signout(countryCode)
  }

  return (
    <div>
      <div className="small:hidden" data-testid="mobile-account-nav">
        {accountRoute !== "/account" ? (
          <LocalizedClientLink
            href="/account"
            className="flex items-center gap-x-2 text-small-regular py-2"
            data-testid="account-main-link"
          >
            <>
              <ChevronDown className="transform rotate-90" />
              <span>Account</span>
            </>
          </LocalizedClientLink>
        ) : (
          <>
            <div className="text-xl-semi mb-4 px-8">
              Hello {customer?.first_name}
            </div>
            <div className="text-base-regular">
              <ul>
                <li>
                  <LocalizedClientLink
                    href="/account/profile"
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                    data-testid="profile-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <User size={20} />
                        <span>Profile</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/addresses"
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                    data-testid="addresses-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <MapPin size={20} />
                        <span>Addresses</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/orders"
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                    data-testid="orders-link"
                  >
                    <div className="flex items-center gap-x-2">
                      <Package size={20} />
                      <span>Orders</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </LocalizedClientLink>
                </li>
                <li>
                  <button
                    type="button"
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8 w-full"
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    <div className="flex items-center gap-x-2">
                      <ArrowRightOnRectangle />
                      <span>Log out</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
      <div className="hidden small:block" data-testid="account-nav">
        <div className="mr-5 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="text-base-regular">
            <ul className="flex mb-0 justify-start items-start flex-col gap-y-1">
              <li>
                <AccountNavLink
                  href="/account"
                  route={route!}
                  data-testid="overview-link"
                  icon={House}
                >
                  Dashboard
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/orders"
                  route={route!}
                  data-testid="orders-link"
                  icon={CubeSolid}
                >
                  Orders
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/wishlist"
                  route={route!}
                  data-testid="wishlist-link"
                  icon={Heart}
                >
                  Wishlist
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/compare"
                  route={route!}
                  data-testid="compare-link"
                  icon={CodeCompare}
                >
                  Compare
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/addresses"
                  route={route!}
                  data-testid="addresses-link"
                  icon={MedusaMapPin}
                >
                  Addresses
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/profile"
                  route={route!}
                  data-testid="profile-link"
                  icon={MedusaUser}
                >
                  Account Details
                </AccountNavLink>
              </li>
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
