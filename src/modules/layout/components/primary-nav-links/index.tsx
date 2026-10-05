"use client"

import { stripCountryCodeFromPath } from "@lib/util/routes"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { TagIcon } from "@modules/layout/components/cba-icons"
import { usePathname, useSearchParams } from "next/navigation"

type PrimaryNavLink = {
  label: string
  href: string
}

type PrimaryNavLinksProps = {
  links: PrimaryNavLink[]
  dealsLabel: string
  dealsUrl: string
  hasDealsLink: boolean
}

const dealsNavLinkClassName =
  "deals-nav-link inline-flex h-7 items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 text-[13px] font-semibold leading-none text-brand transition-[background-color,border-color,color] hover:border-brand hover:bg-brand hover:text-white focus-visible:border-brand focus-visible:bg-brand focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25"

function activeLinkScore(
  pathname: string,
  searchParams: Pick<URLSearchParams, "getAll">,
  href: string
) {
  if (!href.startsWith("/")) {
    return -1
  }

  const normalizedPathname = stripCountryCodeFromPath(pathname)
  const url = new URL(href, "http://storefront.local")
  const normalizedHref =
    stripCountryCodeFromPath(url.pathname).replace(/\/$/, "") || "/"

  if (normalizedHref === "/") {
    if (normalizedPathname !== "/") return -1
  } else if (
    normalizedPathname !== normalizedHref &&
    !normalizedPathname.startsWith(`${normalizedHref}/`)
  ) {
    return -1
  }

  const queryEntries = Array.from(url.searchParams.entries())
  for (const [key, value] of queryEntries) {
    if (!searchParams.getAll(key).includes(value)) return -1
  }

  return normalizedHref.length * 10 + queryEntries.length * 1000
}

function isDealsLink(link: PrimaryNavLink, dealsLabel: string) {
  return link.label.trim().toLowerCase() === dealsLabel.trim().toLowerCase()
}

export default function PrimaryNavLinks({
  links,
  dealsLabel,
  dealsUrl,
  hasDealsLink,
}: PrimaryNavLinksProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const renderedLinks = [
    ...links.map((link) => ({
      link,
      isDeals: isDealsLink(link, dealsLabel),
    })),
    ...(!hasDealsLink
      ? [{ link: { label: dealsLabel, href: dealsUrl }, isDeals: true }]
      : []),
  ]
  const activeLinkIndex = renderedLinks.reduce(
    (bestIndex, { link }, index) => {
      const score = activeLinkScore(pathname, searchParams, link.href)
      if (score < 0) return bestIndex
      if (bestIndex === -1) return index

      const bestScore = activeLinkScore(
        pathname,
        searchParams,
        renderedLinks[bestIndex].link.href
      )
      return score > bestScore ? index : bestIndex
    },
    -1
  )

  const renderLink = (
    link: PrimaryNavLink,
    isDeals: boolean,
    index: number
  ) => {
    const active = index === activeLinkIndex

    if (isDeals) {
      return (
        <LocalizedClientLink
          key={`${link.label}-${link.href}`}
          href={link.href}
          className={`${dealsNavLinkClassName} mx-3 ${active ? "deals-nav-link--active border-brand bg-brand text-white" : ""}`}
          aria-current={active ? "page" : undefined}
        >
          <TagIcon size={14} strokeWidth={2} />
          <span>{link.label}</span>
        </LocalizedClientLink>
      )
    }

    return (
      <LocalizedClientLink
        key={`${link.label}-${link.href}`}
        href={link.href}
        className={`mx-3 transition-colors hover:text-brand ${active ? "font-semibold text-brand" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        {link.label}
      </LocalizedClientLink>
    )
  }

  return (
    <>
      {renderedLinks.map(({ link, isDeals }, index) =>
        renderLink(link, isDeals, index)
      )}
    </>
  )
}
