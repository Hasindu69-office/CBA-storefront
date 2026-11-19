/**
 * Shared Next.js fetch options for anonymous, semi-static CBA content
 * (CMS layout, homepage merchandising, typography, etc.).
 *
 * Prefer short ISR windows + stable tags over `cache: "no-store"` so the
 * homepage critical path can hit the Next data cache across visitors.
 *
 * Override via storefront env: PUBLIC_CONTENT_REVALIDATE_SECONDS
 * On-demand purge via POST /api/revalidate (REVALIDATE_SECRET).
 */
const DEFAULT_REVALIDATE_SECONDS = 120
const MIN_REVALIDATE_SECONDS = 10
const MAX_REVALIDATE_SECONDS = 3600

export const PUBLIC_CACHE_TAGS = {
  homepage: "cba-homepage",
  featuredProducts: "cba-featured-products",
  bestSellingProducts: "cba-best-selling-products",
  topSellingProducts: "cba-top-selling-products",
  tabbedSaleProducts: "cba-tabbed-sale-products",
  productCards: "cba-product-cards",
  categorySlider: "cba-category-slider",
  homepageBrands: "cba-homepage-brands",
  cmsLayout: "cba-cms-layout",
  typography: "cba-typography",
  kokoBranding: "cba-koko-branding",
  kokoAvailability: "cba-koko-availability",
  accountAuthSettings: "cba-account-auth-settings",
  contactDetails: "cba-contact-details",
  productCategories: "cba-product-categories",
} as const

export type PublicCacheTag =
  (typeof PUBLIC_CACHE_TAGS)[keyof typeof PUBLIC_CACHE_TAGS]

export const PUBLIC_CACHE_SCOPES = {
  all: "all",
  homepage: "homepage",
  cms: "cms",
  merchandising: "merchandising",
  settings: "settings",
} as const

export type PublicCacheScope =
  (typeof PUBLIC_CACHE_SCOPES)[keyof typeof PUBLIC_CACHE_SCOPES]

const SCOPE_TAGS: Record<PublicCacheScope, PublicCacheTag[]> = {
  all: Object.values(PUBLIC_CACHE_TAGS),
  homepage: [
    PUBLIC_CACHE_TAGS.homepage,
    PUBLIC_CACHE_TAGS.featuredProducts,
    PUBLIC_CACHE_TAGS.bestSellingProducts,
    PUBLIC_CACHE_TAGS.topSellingProducts,
    PUBLIC_CACHE_TAGS.tabbedSaleProducts,
    PUBLIC_CACHE_TAGS.productCards,
    PUBLIC_CACHE_TAGS.categorySlider,
    PUBLIC_CACHE_TAGS.homepageBrands,
  ],
  cms: [
    PUBLIC_CACHE_TAGS.homepage,
    PUBLIC_CACHE_TAGS.cmsLayout,
    PUBLIC_CACHE_TAGS.categorySlider,
    PUBLIC_CACHE_TAGS.homepageBrands,
    PUBLIC_CACHE_TAGS.contactDetails,
  ],
  merchandising: [
    PUBLIC_CACHE_TAGS.featuredProducts,
    PUBLIC_CACHE_TAGS.bestSellingProducts,
    PUBLIC_CACHE_TAGS.topSellingProducts,
    PUBLIC_CACHE_TAGS.tabbedSaleProducts,
    PUBLIC_CACHE_TAGS.productCards,
    PUBLIC_CACHE_TAGS.homepage,
  ],
  settings: [
    PUBLIC_CACHE_TAGS.cmsLayout,
    PUBLIC_CACHE_TAGS.typography,
    PUBLIC_CACHE_TAGS.kokoBranding,
    PUBLIC_CACHE_TAGS.kokoAvailability,
    PUBLIC_CACHE_TAGS.accountAuthSettings,
    PUBLIC_CACHE_TAGS.contactDetails,
  ],
}

const ALL_TAGS = new Set<string>(Object.values(PUBLIC_CACHE_TAGS))

function parsePublicContentRevalidateSeconds(): number {
  const raw = process.env.PUBLIC_CONTENT_REVALIDATE_SECONDS?.trim()
  if (!raw) {
    return DEFAULT_REVALIDATE_SECONDS
  }

  const parsed = Number(raw)
  if (!Number.isInteger(parsed)) {
    return DEFAULT_REVALIDATE_SECONDS
  }

  return Math.min(
    MAX_REVALIDATE_SECONDS,
    Math.max(MIN_REVALIDATE_SECONDS, parsed)
  )
}

export const PUBLIC_CONTENT_REVALIDATE_SECONDS =
  parsePublicContentRevalidateSeconds()

export function publicContentFetchOptions(tags: string[]) {
  return {
    cache: "force-cache" as const,
    next: {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
      tags,
    },
  }
}

export function resolvePublicCacheTags(input: {
  tags?: string[]
  scopes?: string[]
}): PublicCacheTag[] {
  const resolved = new Set<PublicCacheTag>()

  for (const scope of input.scopes ?? []) {
    const tags = SCOPE_TAGS[scope as PublicCacheScope]
    if (!tags) {
      continue
    }
    for (const tag of tags) {
      resolved.add(tag)
    }
  }

  for (const tag of input.tags ?? []) {
    if (ALL_TAGS.has(tag)) {
      resolved.add(tag as PublicCacheTag)
    }
  }

  if (!resolved.size) {
    return [...SCOPE_TAGS.all]
  }

  return [...resolved]
}
