import { listCategories } from "@lib/data/categories"
import {
  FooterColumn,
  footerItemsToColumns,
  retrieveCmsLayout,
} from "@lib/data/cms-layout"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import NewsletterForm from "@modules/layout/components/newsletter-form"
import Image from "next/image"
import Link from "next/link"

const SocialIcon = ({
  d,
  viewBox = "0 0 24 24",
}: {
  d: string
  viewBox?: string
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={viewBox}
    fill="currentColor"
    className="w-4 h-4"
  >
    <path d={d} />
  </svg>
)

const facebookPath =
  "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
const twitterPath =
  "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
const instagramPath =
  "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
const linkedinPath =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
const mailPath =
  "M2 5.5v13C2 19.327 2.673 20 3.5 20h17c.827 0 1.5-.673 1.5-1.5v-13c0-.827-.673-1.5-1.5-1.5h-17C2.673 4 2 4.673 2 5.5zm1.5-.5h17c.276 0 .5.224.5.5v.726l-8.528 5.685a.999.999 0 0 1-1.11 0L2.5 6.226V5.5c0-.276.224-.5.5-.5zm17 14h-17c-.276 0-.5-.224-.5-.5V7.43l8.444 5.63a1.996 1.996 0 0 0 2.222 0L22 7.43v11.07c0 .276-.224.5-.5.5z"

const fallbackCategories = [
  "Photocopiers",
  "Dot Matrix Printers",
  "Scanners",
  "ID Printers",
  "Projectors",
  "POS",
  "Accessories",
]

const aboutLinks = [
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Shipping Policy", href: "/delivery-information" },
  { label: "About Us", href: "/about-us" },
  { label: "Legal Policy", href: "#" },
  { label: "Warranty Policy", href: "/warranty-information" },
  { label: "Returns & Refunds", href: "/return-policy" },
]

const accountLinks = [
  { label: "My Orders", href: "/account/orders" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Compare", href: "/compare" },
  { label: "Manage Account", href: "/account" },
  { label: "My Reviews", href: "/account" },
  { label: "FAQs", href: "/contact" },
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
]

function topLevelCategories(categories: HttpTypes.StoreProductCategory[]) {
  return categories.filter((category) => !category.parent_category).slice(0, 7)
}

function FooterTextLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const className = "hover:text-orange-500 flex items-center gap-2 transition-colors"

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className} rel="noopener noreferrer">
        {children}
      </a>
    )
  }

  if (href === "#") {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <LocalizedClientLink href={href} className={className}>
      {children}
    </LocalizedClientLink>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  const className =
    "w-10 h-10 rounded-full border border-orange-500 flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"

  if (/^https?:\/\//i.test(href)) {
    return (
      <a
        href={href}
        className={className}
        aria-label={label}
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className} aria-label={label}>
      {children}
    </Link>
  )
}

function socialPath(label: string) {
  const normalized = label.trim().toLowerCase()
  if (normalized.includes("facebook")) return facebookPath
  if (normalized.includes("twitter") || normalized.includes("x")) return twitterPath
  if (normalized.includes("instagram")) return instagramPath
  if (normalized.includes("linkedin")) return linkedinPath
  return mailPath
}

function companyNameLines(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim()
  const cbaMatch = normalized.match(
    /^ceylon business appliances\s+\(pvt\)\s+ltd$/i
  )

  if (cbaMatch) {
    return ["Ceylon Business", "Appliances (Pvt)", "Ltd"]
  }

  return [normalized]
}

function companyAddressLines(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim()
  const sriLankaIndex = normalized.toLowerCase().lastIndexOf("sri lanka")

  if (sriLankaIndex > 0) {
    return [
      normalized.slice(0, sriLankaIndex).trim().replace(/,+$/, ","),
      normalized.slice(sriLankaIndex).trim(),
    ]
  }

  return [normalized]
}

export default async function Footer() {
  const [categories, cmsLayout] = await Promise.all([
    listCategories().catch(() => []),
    retrieveCmsLayout(),
  ])
  const categoryLinks = topLevelCategories(categories).map((category) => ({
    label: category.name,
    href: `/categories/${category.handle}`,
  }))
  const visibleCategories = categoryLinks.length
    ? categoryLinks
    : fallbackCategories.map((label) => ({ label, href: "/store" }))
  const fallbackColumns: FooterColumn[] = [
    { label: "About", href: "/", links: aboutLinks },
    { label: "Categories", href: "/", links: visibleCategories },
    { label: "My Account", href: "/", links: accountLinks },
  ]
  const footerColumns = footerItemsToColumns(
    cmsLayout.footerMenuItems,
    categories,
    fallbackColumns
  )

  return (
    <footer className="w-full relative isolate mt-24 pt-20 pb-[calc(104px+env(safe-area-inset-bottom))] small:pb-0 medium:mt-20 medium:pt-10">
      <div
        className="absolute inset-0 w-full h-full z-0 pointer-events-none medium:hidden"
        aria-hidden="true"
        style={{
          backgroundImage: "url('/images/footerbgimg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          WebkitMaskImage:
            "url('/images/Asset 1 1.svg'), linear-gradient(to bottom, transparent 52vw, black 52vw)",
          WebkitMaskSize: "100% auto, 100% 100%",
          WebkitMaskPosition: "top center, top left",
          WebkitMaskRepeat: "no-repeat, no-repeat",
          maskImage:
            "url('/images/Asset 1 1.svg'), linear-gradient(to bottom, transparent 52vw, black 52vw)",
          maskSize: "100% auto, 100% 100%",
          maskPosition: "top center, top left",
          maskRepeat: "no-repeat, no-repeat",
        }}
      />

      <div
        className="absolute inset-0 w-full h-full z-0 pointer-events-none hidden medium:block"
        aria-hidden="true"
        style={{
          backgroundImage: "url('/images/footerbgimg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          WebkitMaskImage:
            "url('/images/svgviewer-output.svg'), linear-gradient(to bottom, transparent 8vw, black 8vw)",
          WebkitMaskSize: "100% auto, 100% 100%",
          WebkitMaskPosition: "top center, top left",
          WebkitMaskRepeat: "no-repeat, no-repeat",
          maskImage:
            "url('/images/svgviewer-output.svg'), linear-gradient(to bottom, transparent 8vw, black 8vw)",
          maskSize: "100% auto, 100% 100%",
          maskPosition: "top center, top left",
          maskRepeat: "no-repeat, no-repeat",
        }}
      />

      <div className="absolute top-0 left-0 w-full flex justify-center -mt-[112px] max-[399px]:-mt-[148px] z-30 pointer-events-none px-5 min-[640px]:max-[1279px]:-mt-[8px] medium:-mt-[6.25vw] medium:px-4">
        {cmsLayout.footer.newsletter.enabled && (
          <div className="w-full max-w-[560px] px-5 py-7 pointer-events-auto text-center small:max-w-[640px] small:px-10 small:py-9 medium:w-[46vw] medium:max-w-3xl medium:px-8 medium:py-7">
            <h2 className="text-2xl font-bold text-black mb-3 small:text-3xl medium:text-[26px] medium:leading-8">
              {cmsLayout.footer.newsletter.title}
            </h2>
            <p className="mx-auto mb-6 max-w-[420px] text-base leading-6 text-gray-600 small:text-lg small:leading-7 medium:max-w-none medium:text-[14px] medium:leading-5">
              {cmsLayout.footer.newsletter.description}
            </p>
            <NewsletterForm />
          </div>
        )}
      </div>

      <div className="relative z-10 content-container pt-36 pb-10 min-[640px]:max-[1279px]:pt-[40vw] medium:pt-32 medium:pb-12">
        <div className="grid grid-cols-1 gap-10 text-white small:grid-cols-2 small:gap-x-8 small:gap-y-12 medium:grid-cols-4 medium:gap-12">
          <div className="space-y-5 text-center small:col-span-2 medium:col-span-1 medium:space-y-6 medium:text-left">
            <div className="flex flex-col items-center gap-4 medium:flex-row medium:items-center medium:gap-3">
              <Image
                src={cmsLayout.footer.company.logo_url}
                alt={cmsLayout.footer.company.logo_alt_text}
                width={80}
                height={80}
                className="h-20 w-20 flex-shrink-0 object-contain"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-xl leading-tight uppercase tracking-wider medium:text-lg">
                  {companyNameLines(cmsLayout.footer.company.name).map((line) => (
                    <span key={line} className="block whitespace-nowrap">
                      {line}
                    </span>
                  ))}
                </h3>
                <p className="text-xs text-gray-400 mt-2 uppercase medium:mt-1">
                  {companyAddressLines(cmsLayout.footer.company.address).map(
                    (line) => (
                      <span key={line} className="block whitespace-nowrap">
                        {line}
                      </span>
                    )
                  )}
                </p>
              </div>
            </div>
            <p className="mx-auto max-w-[520px] text-base leading-7 text-gray-300 medium:max-w-none medium:text-sm medium:text-gray-400 medium:leading-relaxed">
              {cmsLayout.footer.company.description}
            </p>
            <div className="flex justify-center gap-8 pt-2 medium:justify-start medium:gap-4">
              {cmsLayout.footer.social.links.map((item) => (
                <SocialLink key={item.label} href={item.href} label={item.label}>
                  <SocialIcon d={socialPath(item.label)} />
                </SocialLink>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.label}>
              <h4 className="text-base font-semibold mb-4 border-b border-gray-700 pb-2 inline-block w-full small:text-lg small:mb-6">
                {column.label}
              </h4>
              <ul className="space-y-3 text-sm text-gray-300 small:space-y-4">
                {column.links.map((item) => (
                  <li key={item.label}>
                    <FooterTextLink href={item.href}>
                      <span className="text-current text-xs">&rsaquo;</span>{" "}
                      {item.label}
                    </FooterTextLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <div className="content-container py-6 flex flex-col items-center justify-between gap-4 text-center medium:flex-row medium:text-left">
          <p className="text-xs text-gray-400">
            Copyright &copy; {new Date().getFullYear()}{" "}
            {cmsLayout.footer.copyright.text}
          </p>
          <Image
            src={cmsLayout.footer.payment.image_url}
            alt={cmsLayout.footer.payment.image_alt_text}
            width={384}
            height={36}
            className="h-auto w-full max-w-[192px] sm:max-w-[240px] object-contain"
          />
        </div>
      </div>
    </footer>
  )
}
