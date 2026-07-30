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
import SideCart from "@modules/layout/components/side-cart"
import {
  ChevronDownIcon,
  CoinsIcon,
  FileTextIcon,
  HeadphonesIcon,
  HeartIcon,
  LayoutGridIcon,
  PhoneIcon,
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
        <div className="bg-[#221f1f] text-[#f2f2f2] text-[13px] py-2.5 font-sans">
          <div className="content-container flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <PhoneIcon size={14} className="text-brand" strokeWidth={2} />
                <span>
                  {cmsLayout.header.help.label}{" "}
                  <span className="text-brand font-medium">
                    {cmsLayout.header.help.phone}
                  </span>
                </span>
              </div>
              <span className="hidden medium:block w-px h-3.5 bg-white" />
              <HeaderLink
                href={cmsLayout.header.help.support_url}
                className="hidden medium:flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <HeadphonesIcon
                  size={14}
                  className="text-brand"
                  strokeWidth={2}
                />
                <span>{cmsLayout.header.help.support_label}</span>
                <ChevronDownIcon size={14} className="text-gray-400" />
              </HeaderLink>
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

        <div className="bg-white py-4 small:py-6">
          <div className="content-container flex flex-col small:flex-row small:items-center justify-between gap-5 medium:gap-12">
            <HeaderLink
              href={cmsLayout.header.logo.href}
              className="flex-shrink-0 self-start"
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

            <div className="flex items-center justify-between small:justify-end gap-5 medium:gap-8 text-sm">
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

        <nav className="bg-white pb-2">
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
