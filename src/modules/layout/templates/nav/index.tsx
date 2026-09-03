import { listCategories } from "@lib/data/categories"
import { listCartOptions, retrieveCart } from "@lib/data/cart"
import {
  navigationItemsToLinks,
  retrieveCmsLayout,
} from "@lib/data/cms-layout"
import { retrieveWishlistCount } from "@lib/data/wishlist"
import { HttpTypes, StoreCartShippingOption } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CbaSearchForm from "@modules/layout/components/cba-search-form"
import DesktopCategoryDrawer from "@modules/layout/components/desktop-category-drawer"
import DesktopStickyHeader from "@modules/layout/components/desktop-sticky-header"
import MobileBottomNav from "@modules/layout/components/mobile-bottom-nav"
import MobileHeaderMenu from "@modules/layout/components/mobile-header-menu"
import ScrollToTopButton from "@modules/layout/components/scroll-to-top-button"
import SideCart from "@modules/layout/components/side-cart"
import WishlistHeaderLink from "@modules/layout/components/wishlist-header-link"
import ReactCountryFlag from "react-country-flag"
import {
  ChevronDownIcon,
  CoinsIcon,
  FileTextIcon,
  HeadphonesIcon,
  HeartIcon,
  PhoneIcon,
  TagIcon,
  TruckIcon,
  UserIcon,
} from "@modules/layout/components/cba-icons"
import Image from "next/image"

const fallbackNavLinks = [
  { label: "Printers & MFPs", href: "/store" },
  { label: "POS Systems", href: "/store" },
  { label: "Barcode & Auto ID", href: "/store" },
  { label: "Office Equipments", href: "/store" },
  { label: "Security & Surveillance", href: "/store" },
  { label: "Consumables", href: "/store" },
  { label: "Accessories", href: "/store" },
]

const fallbackDropdownItems = [
  "Desktop PCs",
  "Laptops",
  "Printers & Scanners",
  "Computer Accessories",
]

const dealsNavLinkClassName =
  "deals-nav-link inline-flex h-7 items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 text-[13px] font-semibold leading-none text-brand transition-[background-color,border-color,color] hover:border-brand hover:bg-brand hover:text-white"

function topLevelCategories(categories: HttpTypes.StoreProductCategory[]) {
  return categories.filter((category) => !category.parent_category)
}

function categoryLinks(categories: HttpTypes.StoreProductCategory[]) {
  return categories
    .map((category) => ({
      label: category.name?.trim() ?? "",
      href: category.handle ? `/categories/${category.handle}` : "",
    }))
    .filter((category) => category.label && category.href)
}

function phoneNumberToTelHref(phone: string) {
  const trimmed = phone.trim()
  const prefix = trimmed.startsWith("+") ? "+" : ""
  const dialable = `${prefix}${trimmed.replace(/[^\d]/g, "")}`

  return dialable === prefix ? "#" : `tel:${dialable}`
}

function HeaderLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className} rel="noopener noreferrer">
        {children}
      </a>
    )
  }

  return (
    <LocalizedClientLink href={href} className={className}>
      {children}
    </LocalizedClientLink>
  )
}

function isDealsNavLink(
  link: { label: string; href: string },
  dealsLabel: string
) {
  const linkLabel = link.label.trim().toLowerCase()
  const targetLabel = dealsLabel.trim().toLowerCase()

  return Boolean(targetLabel) && linkLabel === targetLabel
}

function DealsNavLink({
  href,
  label,
  className,
}: {
  href: string
  label: string
  className?: string
}) {
  return (
    <HeaderLink
      href={href}
      className={[dealsNavLinkClassName, className].filter(Boolean).join(" ")}
    >
      <TagIcon size={14} strokeWidth={2} />
      <span>{label}</span>
    </HeaderLink>
  )
}

function customerDisplayName(customer?: HttpTypes.StoreCustomer | null) {
  const firstName = customer?.first_name?.trim()
  const lastName = customer?.last_name?.trim()
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()
  const emailName = customer?.email?.split("@")[0]?.trim()

  return fullName || firstName || emailName || "Customer"
}

function customerFirstDisplayName(customer?: HttpTypes.StoreCustomer | null) {
  const firstName = customer?.first_name?.trim()
  const fullName = customerDisplayName(customer)
  const firstFromFullName = fullName.split(/\s+/)[0]?.trim()

  return firstName || firstFromFullName || "Customer"
}

export default async function Nav({
  customer = null,
}: {
  customer?: HttpTypes.StoreCustomer | null
}) {
  const [categories, cart, wishlistCount, cmsLayout] = await Promise.all([
    listCategories().catch(() => []),
    retrieveCart().catch(() => null),
    retrieveWishlistCount().catch(() => 0),
    retrieveCmsLayout(),
  ])
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const cartOptions = await listCartOptions().catch(() => ({
      shipping_options: [],
    }))
    shippingOptions = cartOptions.shipping_options
  }

  const navCategories = topLevelCategories(categories)
  const navCategoryLinks = categoryLinks(navCategories)
  const fallbackPrimaryLinks = navCategoryLinks.length
    ? [{ label: "Brands", href: "/brands" }, ...navCategoryLinks]
    : [{ label: "Brands", href: "/brands" }, ...fallbackNavLinks]
  const navLinks = navigationItemsToLinks(
    cmsLayout.headerMenuItems,
    categories,
    fallbackPrimaryLinks
  )
  const hasDealsInPrimaryLinks = navLinks.some((link) =>
    isDealsNavLink(
      link,
      cmsLayout.header.commerce.deals_label
    )
  )

  const dropdownItems = navCategoryLinks.length
    ? navCategoryLinks
    : fallbackDropdownItems.map((label) => ({ label, href: "/store" }))

  const mobileMenuLogo = {
    imageUrl: cmsLayout.header.logo.image_url,
    altText: cmsLayout.header.logo.alt_text,
  }
  const helpPhoneHref = phoneNumberToTelHref(cmsLayout.header.help.phone)
  const accountLabel = customer
    ? `Hi, ${customerDisplayName(customer)}`
    : cmsLayout.header.commerce.account_label
  const accountHint = customer ? "My Account" : cmsLayout.header.commerce.account_hint
  const mobileAccountLabel = customer
    ? customerFirstDisplayName(customer)
    : cmsLayout.header.commerce.account_label
  const signedInAccountName = customerFirstDisplayName(customer)

  return (
    <div className="relative z-50 bg-white shadow-sm">
      <header className="w-full flex flex-col">
        <div className="bg-[#221f1f] py-2 font-sans text-[11px] text-[#f2f2f2] xsmall:text-[12px] small:py-2.5 small:text-[13px]">
          <div className="content-container flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 xsmall:gap-3 small:gap-4">
              <div className="flex items-center gap-1.5 whitespace-nowrap xsmall:gap-2">
                <PhoneIcon size={14} className="text-brand" strokeWidth={2} />
                <span>
                  <span className="hidden xsmall:inline">
                    {cmsLayout.header.help.label}{" "}
                  </span>
                  <a
                    href={helpPhoneHref}
                    aria-label={`Call ${cmsLayout.header.help.phone}`}
                    className="text-brand font-medium transition-colors hover:text-brand-hover"
                  >
                    {cmsLayout.header.help.phone}
                  </a>
                </span>
              </div>
              <span className="block h-3.5 w-px bg-white/60" />
              <HeaderLink
                href={cmsLayout.header.help.support_url}
                className="flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white"
              >
                <HeadphonesIcon
                  size={14}
                  className="text-brand"
                  strokeWidth={2}
                />
                <span>{cmsLayout.header.help.support_label}</span>
              </HeaderLink>
            </div>

            <HeaderLink
              href={cmsLayout.header.topbar.track_order_url}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-semibold transition-colors hover:text-white small:hidden"
            >
              <FileTextIcon size={14} strokeWidth={2} />
              <span>{cmsLayout.header.topbar.track_order_label}</span>
            </HeaderLink>

            <div className="hidden small:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TruckIcon size={14} strokeWidth={2} />
                <span>{cmsLayout.header.topbar.delivery_label}</span>
              </div>
              <span className="w-px h-3.5 bg-white" />
              <a
                href="#"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <ReactCountryFlag
                  svg
                  countryCode="US"
                  aria-label="United States"
                  style={{
                    width: "18px",
                    height: "13px",
                    borderRadius: "2px",
                    display: "inline-block",
                  }}
                />
                <span>{cmsLayout.header.topbar.language_label}</span>
              </a>
              <span className="w-px h-3.5 bg-white" />
              <HeaderLink
                href={cmsLayout.header.topbar.track_order_url}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <FileTextIcon size={14} strokeWidth={2} />
                <span>{cmsLayout.header.topbar.track_order_label}</span>
              </HeaderLink>
              <span className="w-px h-3.5 bg-white" />
              <a
                href="#"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <CoinsIcon size={14} strokeWidth={2} />
                <span>{cmsLayout.header.topbar.currency_label}</span>
                <ChevronDownIcon size={14} className="text-gray-400" />
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white py-3 small:py-6">
          <div className="content-container flex flex-col justify-between gap-3 small:flex-row small:items-center small:gap-5 medium:gap-10">
            <div className="flex w-full items-center justify-between gap-2 small:hidden">
              <MobileHeaderMenu
                primaryLinks={navLinks}
                categoryLinks={dropdownItems}
                logo={mobileMenuLogo}
              />
              <HeaderLink
                href={cmsLayout.header.logo.href}
                className="min-w-0 flex-1"
              >
                <Image
                  src={cmsLayout.header.logo.image_url}
                  alt={cmsLayout.header.logo.alt_text}
                  width={244}
                  height={104}
                  priority
                  className="h-auto w-[116px] max-w-full xsmall:w-[132px]"
                />
              </HeaderLink>

              <div className="flex shrink-0 items-center justify-end gap-3 text-[11px] xsmall:gap-4 xsmall:text-[12px]">
                <SideCart cart={cart} shippingOptions={shippingOptions} />

                <WishlistHeaderLink
                  initialCount={wishlistCount}
                  label={cmsLayout.header.commerce.wishlist_label}
                  variant="mobile"
                />

                <LocalizedClientLink
                  href="/account"
                  className="flex min-w-[38px] flex-col items-center gap-0.5 text-black transition-opacity hover:opacity-80 xsmall:min-w-[42px]"
                >
                  {customer ? (
                    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-brand text-white ring-2 ring-orange-100">
                      <UserIcon
                        size={16}
                        strokeWidth={1.8}
                        className="text-white"
                      />
                    </span>
                  ) : (
                    <UserIcon
                      size={23}
                      strokeWidth={1.55}
                      className="text-black"
                    />
                  )}
                  <span className="max-w-[58px] truncate leading-none">
                    {mobileAccountLabel}
                  </span>
                </LocalizedClientLink>
              </div>
            </div>

            <HeaderLink
              href={cmsLayout.header.logo.href}
              className="hidden flex-shrink-0 self-start small:block"
            >
              <Image
                src={cmsLayout.header.logo.image_url}
                alt={cmsLayout.header.logo.alt_text}
                width={244}
                height={104}
                priority
                className="w-[180px] small:w-[244px] h-auto"
              />
            </HeaderLink>

            <div className="w-full small:flex-1 small:max-w-[700px] large:max-w-[780px]">
              <CbaSearchForm />
            </div>

            <div className="hidden items-center justify-between gap-5 text-sm small:flex small:justify-end medium:gap-7">
              <SideCart
                cart={cart}
                shippingOptions={shippingOptions}
                wishlistCount={wishlistCount}
                listenForOpenEvents
              />

              <WishlistHeaderLink
                initialCount={wishlistCount}
                label={cmsLayout.header.commerce.wishlist_label}
                variant="desktop"
              />

              <LocalizedClientLink
                href="/account"
                className="flex min-w-0 items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                {customer ? (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white ring-2 ring-orange-100">
                      <UserIcon
                        size={22}
                        strokeWidth={1.8}
                        className="text-white"
                      />
                    </span>
                    <span className="hidden min-w-0 max-w-[148px] leading-tight medium:block">
                      <span className="block text-[12px] font-medium text-gray-500">
                        Hi!
                      </span>
                      <span className="block truncate text-[15px] font-semibold text-black">
                        {signedInAccountName}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <UserIcon size={26} strokeWidth={1.5} className="text-black" />
                    <div className="hidden medium:block leading-tight">
                      <p className="font-semibold text-black text-[15px]">
                        {accountLabel}
                      </p>
                      <p className="text-gray-400 text-[12px] mt-0.5">
                        {accountHint}
                      </p>
                    </div>
                  </>
                )}
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        <div className="border-y border-gray-100 bg-white small:hidden">
          <div className="grid h-12 grid-cols-[1fr_1fr]">
            <div className="border-r border-gray-100">
              <MobileHeaderMenu
                primaryLinks={navLinks}
                categoryLinks={dropdownItems}
                logo={mobileMenuLogo}
                variant="categories"
              />
            </div>
            <HeaderLink
              href={cmsLayout.header.commerce.deals_url}
              className="flex items-center justify-center gap-2 px-3 text-[14px] font-bold text-brand xsmall:text-[15px]"
            >
              <TagIcon size={18} strokeWidth={2} />
              <span>{cmsLayout.header.commerce.deals_label}</span>
            </HeaderLink>
          </div>
        </div>

        <DesktopStickyHeader>
          <div className="content-container">
            <div className="flex h-14 items-center gap-4">
              <HeaderLink
                href={cmsLayout.header.logo.href}
                className="flex w-[148px] flex-shrink-0 items-center"
              >
                <Image
                  src={cmsLayout.header.logo.image_url}
                  alt={cmsLayout.header.logo.alt_text}
                  width={180}
                  height={76}
                  priority
                  className="h-auto w-[128px] max-w-full"
                />
              </HeaderLink>

              <DesktopCategoryDrawer
                label={cmsLayout.header.commerce.all_categories_label}
                links={dropdownItems}
              />

              <div className="min-w-[280px] flex-1">
                <CbaSearchForm
                  inputId="sticky-site-search"
                  listboxId="sticky-site-search-results"
                />
              </div>

              <div className="flex flex-shrink-0 items-center justify-end gap-5 text-sm">
                <SideCart
                  cart={cart}
                  shippingOptions={shippingOptions}
                  wishlistCount={wishlistCount}
                />

                <WishlistHeaderLink
                  initialCount={wishlistCount}
                  label={cmsLayout.header.commerce.wishlist_label}
                  variant="desktop"
                />

                <LocalizedClientLink
                  href="/account"
                  className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80"
                >
                  {customer ? (
                    <>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white ring-2 ring-orange-100">
                        <UserIcon
                          size={20}
                          strokeWidth={1.8}
                          className="text-white"
                        />
                      </span>
                      <span className="hidden min-w-0 max-w-[120px] leading-tight medium:block">
                        <span className="block text-[11px] font-medium text-gray-500">
                          Hi!
                        </span>
                        <span className="block truncate text-[13px] font-semibold text-black">
                          {signedInAccountName}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <UserIcon size={24} strokeWidth={1.5} className="text-black" />
                      <div className="hidden leading-tight medium:block">
                        <p className="text-[13px] font-semibold text-black">
                          {accountLabel}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {accountHint}
                        </p>
                      </div>
                    </>
                  )}
                </LocalizedClientLink>
              </div>
            </div>

            <div className="mt-1 flex min-h-9 items-center justify-center border-t border-gray-100 pt-1">
              <div className="no-scrollbar flex min-w-0 max-w-full items-center justify-center overflow-x-auto whitespace-nowrap text-[13px] font-medium text-[#2d2d2d]">
                {navLinks.map((link) =>
                  isDealsNavLink(
                    link,
                    cmsLayout.header.commerce.deals_label
                  ) ? (
                    <DealsNavLink
                      key={`sticky-${link.label}`}
                      href={link.href}
                      label={link.label}
                      className="mr-7"
                    />
                  ) : (
                    <HeaderLink
                      key={`sticky-${link.label}`}
                      href={link.href}
                      className="mr-7 transition-colors hover:text-brand"
                    >
                      {link.label}
                    </HeaderLink>
                  )
                )}

                {!hasDealsInPrimaryLinks && (
                  <DealsNavLink
                    href={cmsLayout.header.commerce.deals_url}
                    label={cmsLayout.header.commerce.deals_label}
                  />
                )}
              </div>
            </div>
          </div>
        </DesktopStickyHeader>

        <nav className="hidden bg-white pb-2 small:block">
          <div className="content-container">
            <div className="flex items-center border border-gray-100 rounded-md overflow-visible">
              <DesktopCategoryDrawer
                label={cmsLayout.header.commerce.all_categories_label}
                links={dropdownItems}
              />

              <div className="flex items-center flex-1 px-4 small:px-6 font-medium text-[13px] text-[#2d2d2d] overflow-x-auto whitespace-nowrap no-scrollbar">
                {navLinks.map((link) =>
                  isDealsNavLink(
                    link,
                    cmsLayout.header.commerce.deals_label
                  ) ? (
                    <DealsNavLink
                      key={link.label}
                      href={link.href}
                      label={link.label}
                      className="mx-3"
                    />
                  ) : (
                    <HeaderLink
                      key={link.label}
                      href={link.href}
                      className="mx-3 transition-colors hover:text-brand"
                    >
                      {link.label}
                    </HeaderLink>
                  )
                )}

                {!hasDealsInPrimaryLinks && (
                  <DealsNavLink
                    href={cmsLayout.header.commerce.deals_url}
                    label={cmsLayout.header.commerce.deals_label}
                    className="mx-3"
                  />
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>
      <MobileBottomNav
        cart={cart}
        primaryLinks={navLinks}
        categoryLinks={dropdownItems}
        logo={mobileMenuLogo}
      />
      <ScrollToTopButton />
    </div>
  )
}
