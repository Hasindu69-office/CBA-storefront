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
import MobileHeaderMenu from "@modules/layout/components/mobile-header-menu"
import SideCart from "@modules/layout/components/side-cart"
import {
  ChevronDownIcon,
  CoinsIcon,
  FileTextIcon,
  HeadphonesIcon,
  HeartIcon,
  LayoutGridIcon,
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

function topLevelCategories(categories: HttpTypes.StoreProductCategory[]) {
  return categories.filter((category) => !category.parent_category).slice(0, 7)
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

export default async function Nav() {
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
  const fallbackPrimaryLinks = navCategories.length
    ? navCategories.map((category) => ({
        label: category.name,
        href: `/categories/${category.handle}`,
      }))
    : fallbackNavLinks
  const navLinks = navigationItemsToLinks(
    cmsLayout.headerMenuItems,
    categories,
    fallbackPrimaryLinks
  )

  const dropdownItems = navCategories.length
    ? navCategories.slice(0, 6).map((category) => ({
        label: category.name,
        href: `/categories/${category.handle}`,
      }))
    : fallbackDropdownItems.map((label) => ({ label, href: "/store" }))

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
                  <span className="text-brand font-medium">
                    {cmsLayout.header.help.phone}
                  </span>
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
                <ChevronDownIcon
                  size={14}
                  className="hidden text-gray-400 xsmall:block"
                />
              </HeaderLink>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-semibold small:hidden">
              <TruckIcon size={14} strokeWidth={2} />
              <span>{cmsLayout.header.topbar.delivery_label}</span>
            </div>

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
                <span className="inline-block w-[18px] h-[13px] rounded-sm overflow-hidden bg-[#002868] shadow-[inset_0_0_0_999px_rgba(255,255,255,0.02)]" />
                <span>{cmsLayout.header.topbar.language_label}</span>
                <ChevronDownIcon size={14} className="text-gray-400" />
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
          <div className="content-container flex flex-col justify-between gap-3 small:flex-row small:items-center small:gap-5 medium:gap-12">
            <div className="flex w-full items-center justify-between gap-2 small:hidden">
              <MobileHeaderMenu
                primaryLinks={navLinks}
                categoryLinks={dropdownItems}
                logo={{
                  imageUrl: cmsLayout.header.logo.image_url,
                  altText: cmsLayout.header.logo.alt_text,
                }}
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
                <LocalizedClientLink
                  href="/account"
                  className="flex min-w-[38px] flex-col items-center gap-0.5 text-black transition-opacity hover:opacity-80 xsmall:min-w-[42px]"
                >
                  <UserIcon
                    size={23}
                    strokeWidth={1.55}
                    className="text-black"
                  />
                  <span className="leading-none">Account</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/wishlist"
                  className="flex min-w-[38px] flex-col items-center gap-0.5 text-black transition-opacity hover:opacity-80 xsmall:min-w-[42px]"
                  aria-label={`Wishlist with ${wishlistCount} ${
                    wishlistCount === 1 ? "item" : "items"
                  }`}
                >
                  <span className="relative block">
                    <HeartIcon
                      size={23}
                      strokeWidth={1.55}
                      className="text-black"
                    />
                    {wishlistCount > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white">
                        {wishlistCount}
                      </span>
                    )}
                  </span>
                  <span className="leading-none">Wishlist</span>
                </LocalizedClientLink>

                <SideCart cart={cart} shippingOptions={shippingOptions} />
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

            <div className="w-full small:flex-1 small:max-w-[600px]">
              <CbaSearchForm />
            </div>

            <div className="hidden items-center justify-between gap-5 text-sm small:flex small:justify-end medium:gap-8">
              <LocalizedClientLink
                href="/account"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <UserIcon size={26} strokeWidth={1.5} className="text-black" />
                <div className="hidden medium:block leading-tight">
                  <p className="font-semibold text-black text-[15px]">
                    {cmsLayout.header.commerce.account_label}
                  </p>
                  <p className="text-gray-400 text-[12px] mt-0.5">
                    {cmsLayout.header.commerce.account_hint}
                  </p>
                </div>
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/wishlist"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <HeartIcon size={26} strokeWidth={1.5} className="text-black" />
                <div className="hidden medium:block leading-tight">
                  <p className="font-semibold text-black text-[15px]">
                    {cmsLayout.header.commerce.wishlist_label}
                  </p>
                  <p className="text-gray-400 text-[12px] mt-0.5">
                    {wishlistCount} {wishlistCount === 1 ? "item" : "items"}
                  </p>
                </div>
              </LocalizedClientLink>

              <SideCart
                cart={cart}
                shippingOptions={shippingOptions}
                wishlistCount={wishlistCount}
              />
            </div>
          </div>
        </div>

        <div className="border-y border-gray-100 bg-white small:hidden">
          <div className="grid h-12 grid-cols-[1fr_1fr]">
            <div className="border-r border-gray-100">
              <MobileHeaderMenu
                primaryLinks={navLinks}
                categoryLinks={dropdownItems}
                logo={{
                  imageUrl: cmsLayout.header.logo.image_url,
                  altText: cmsLayout.header.logo.alt_text,
                }}
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

        <nav className="hidden bg-white pb-2 small:block">
          <div className="content-container">
            <div className="flex items-center border border-gray-100 rounded-md overflow-visible">
              <div className="bg-[#1f1a1a] text-white h-[46px] flex items-center px-5 cursor-pointer font-medium w-[220px] justify-between group relative rounded-md flex-shrink-0">
                <div className="flex items-center gap-3">
                  <LayoutGridIcon size={18} />
                  <span className="text-[14.5px]">
                    {cmsLayout.header.commerce.all_categories_label}
                  </span>
                </div>
                <ChevronDownIcon size={16} className="text-white/80" />

                <div className="absolute top-full left-0 w-full bg-white text-gray-800 shadow-lg border border-gray-100 hidden group-hover:block z-50 rounded-b-md">
                  <ul className="py-2">
                    {dropdownItems.map((item) => (
                      <li
                        key={item.label}
                        className="border-b border-gray-50 last:border-b-0"
                      >
                        <LocalizedClientLink
                          href={item.href}
                          className="block px-6 py-2 hover:bg-gray-50 transition-colors text-sm"
                        >
                          {item.label}
                        </LocalizedClientLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center flex-1 px-4 small:px-6 font-medium text-[13px] text-[#2d2d2d] overflow-x-auto whitespace-nowrap no-scrollbar">
                {navLinks.map((link) => (
                  <HeaderLink
                    key={link.label}
                    href={link.href}
                    className="hover:text-brand transition-colors mx-3"
                  >
                    {link.label}
                  </HeaderLink>
                ))}

                <HeaderLink
                  href={cmsLayout.header.commerce.deals_url}
                  className="text-brand hover:text-brand-hover transition-colors mx-3 font-medium"
                >
                  {cmsLayout.header.commerce.deals_label}
                </HeaderLink>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}
