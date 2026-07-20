import { listCategories } from "@lib/data/categories"
import { retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CbaSearchForm from "@modules/layout/components/cba-search-form"
import {
  ChevronDownIcon,
  CoinsIcon,
  FileTextIcon,
  HeadphonesIcon,
  HeartIcon,
  LayoutGridIcon,
  PhoneIcon,
  ShoppingCartIcon,
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

function cartItemCount(cart: HttpTypes.StoreCart | null) {
  return (
    cart?.items?.reduce((total, item) => {
      return total + item.quantity
    }, 0) ?? 0
  )
}

export default async function Nav() {
  const [categories, cart] = await Promise.all([
    listCategories().catch(() => []),
    retrieveCart().catch(() => null),
  ])

  const navCategories = topLevelCategories(categories)
  const navLinks = navCategories.length
    ? navCategories.map((category) => ({
        label: category.name,
        href: `/categories/${category.handle}`,
      }))
    : fallbackNavLinks

  const dropdownItems = navCategories.length
    ? navCategories.slice(0, 6).map((category) => ({
        label: category.name,
        href: `/categories/${category.handle}`,
      }))
    : fallbackDropdownItems.map((label) => ({ label, href: "/store" }))

  const itemCount = cartItemCount(cart)

  return (
    <div className="relative z-50 bg-white shadow-sm">
      <header className="w-full flex flex-col">
        <div className="bg-[#221f1f] text-[#f2f2f2] text-[13px] py-2.5 font-sans">
          <div className="content-container flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <PhoneIcon size={14} className="text-brand" strokeWidth={2} />
                <span>
                  Need Help ?{" "}
                  <span className="text-brand font-medium">011 764 5200</span>
                </span>
              </div>
              <span className="hidden medium:block w-px h-3.5 bg-white" />
              <a
                href="#"
                className="hidden medium:flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <HeadphonesIcon
                  size={14}
                  className="text-brand"
                  strokeWidth={2}
                />
                <span>Support</span>
                <ChevronDownIcon size={14} className="text-gray-400" />
              </a>
            </div>

            <div className="hidden small:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TruckIcon size={14} strokeWidth={2} />
                <span>Delivery Islandwide</span>
              </div>
              <span className="w-px h-3.5 bg-white" />
              <a
                href="#"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <span className="inline-block w-[18px] h-[13px] rounded-sm overflow-hidden bg-[#002868] shadow-[inset_0_0_0_999px_rgba(255,255,255,0.02)]" />
                <span>English</span>
                <ChevronDownIcon size={14} className="text-gray-400" />
              </a>
              <span className="w-px h-3.5 bg-white" />
              <a
                href="#"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <FileTextIcon size={14} strokeWidth={2} />
                <span>Track Order</span>
              </a>
              <span className="w-px h-3.5 bg-white" />
              <a
                href="#"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <CoinsIcon size={14} strokeWidth={2} />
                <span>LKR</span>
                <ChevronDownIcon size={14} className="text-gray-400" />
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white py-4 small:py-6">
          <div className="content-container flex flex-col small:flex-row small:items-center justify-between gap-5 medium:gap-12">
            <LocalizedClientLink href="/" className="flex-shrink-0 self-start">
              <Image
                src="/images/ebizCBAlogo.png"
                alt="CBA ebiz logo"
                width={244}
                height={104}
                priority
                className="w-[180px] small:w-[244px] h-auto"
              />
            </LocalizedClientLink>

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
                  <p className="font-semibold text-black text-[15px]">Account</p>
                  <p className="text-gray-400 text-[12px] mt-0.5">
                    Sign In / Register
                  </p>
                </div>
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/wishlist"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <HeartIcon size={26} strokeWidth={1.5} className="text-black" />
                <div className="hidden medium:block leading-tight">
                  <p className="font-semibold text-black text-[15px]">Wishlist</p>
                  <p className="text-gray-400 text-[12px] mt-0.5">0 items</p>
                </div>
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/cart"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                data-testid="nav-cart-link"
              >
                <ShoppingCartIcon
                  size={26}
                  strokeWidth={1.5}
                  className="text-black"
                />
                <div className="hidden medium:block leading-tight">
                  <p className="font-semibold text-black text-[15px]">Cart</p>
                  <p className="text-gray-400 text-[12px] mt-0.5">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        <nav className="bg-white pb-2">
          <div className="content-container">
            <div className="flex items-center border border-gray-100 rounded-md overflow-visible">
              <div className="bg-[#1f1a1a] text-white h-[46px] flex items-center px-5 cursor-pointer font-medium w-[220px] justify-between group relative rounded-md flex-shrink-0">
                <div className="flex items-center gap-3">
                  <LayoutGridIcon size={18} />
                  <span className="text-[14.5px]">All Categories</span>
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
                  <LocalizedClientLink
                    key={link.label}
                    href={link.href}
                    className="hover:text-brand transition-colors mx-3"
                  >
                    {link.label}
                  </LocalizedClientLink>
                ))}

                <a
                  href="#"
                  className="text-brand hover:text-brand-hover transition-colors mx-3 font-medium"
                >
                  Deals
                </a>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}
