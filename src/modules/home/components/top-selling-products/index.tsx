import { listTopSellingProductCards } from "@lib/data/top-selling-products"
import type { KokoCheckoutBranding } from "@lib/data/koko-branding"
import type { HomepageCmsSection } from "@lib/data/homepage"
import FeaturedProductSlider from "@modules/home/components/featured-product-slider"

type TopSellingProductsSectionProps = {
  sections: HomepageCmsSection[]
  kokoBranding?: KokoCheckoutBranding | null
  kokoAvailable?: boolean
}

const TOP_SELLING_PLACEMENT = "homepage_top_selling_products"
const FALLBACK_TITLE = "Top Selling Products"
const FALLBACK_CTA_LABEL = "View All Categories"
const FALLBACK_CTA_HREF = "/store"
const DEFAULT_LIMIT = 12
const MAX_LIMIT = 24

const TopSellingProductsSection = async ({
  sections,
  kokoBranding,
  kokoAvailable = false,
}: TopSellingProductsSectionProps) => {
  const section = sections.find(isTopSellingSection)
  if (!section) {
    return null
  }

  const sourceType = sourceTypeConfig(section.config?.source_type)
  const sourceId =
    stringConfig(section.config?.source_id) ||
    stringConfig(section.config?.category_id)
  if (!sourceId) {
    return null
  }

  const products = await listTopSellingProductCards({
    sourceType,
    sourceId,
    limit: limitConfig(section.config?.limit),
  }).catch(() => [])

  if (!products.length) {
    return null
  }

  const title = section.title?.trim() || FALLBACK_TITLE
  const description = stringConfig(section.config?.description)
  const ctaLabel = hasConfigKey(section.config, "cta_label")
    ? stringConfig(section.config?.cta_label)
    : FALLBACK_CTA_LABEL
  const ctaHref = hasConfigKey(section.config, "cta_url")
    ? safeHrefConfig(section.config?.cta_url)
    : FALLBACK_CTA_HREF

  return (
    <FeaturedProductSlider
      products={products}
      title={title}
      description={description}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      titleId="top-selling-products-title"
      mobileCompactCards
      sectionClassName="bg-white pt-7 pb-11 sm:pt-9 sm:pb-14 md:pb-16 small:py-14"
      kokoBranding={kokoBranding}
      kokoAvailable={kokoAvailable}
    />
  )
}

function isTopSellingSection(section: HomepageCmsSection) {
  return (
    section.type === "product_tabs" &&
    section.config?.placement === TOP_SELLING_PLACEMENT
  )
}

function stringConfig(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

function sourceTypeConfig(value: unknown): "category" | "brand" | "badge" {
  if (value === "brand" || value === "badge" || value === "category") {
    return value
  }
  return "category"
}

function limitConfig(value: unknown) {
  const parsed = Number(value ?? DEFAULT_LIMIT)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_LIMIT
    ? parsed
    : DEFAULT_LIMIT
}

function safeHrefConfig(value: unknown) {
  const href = stringConfig(value)
  if (!href) {
    return ""
  }
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\\\")) {
    return href
  }
  if (href.startsWith("#") && /^#[A-Za-z0-9_-]+$/.test(href)) {
    return href
  }
  if (/^https?:\/\//i.test(href)) {
    return href
  }
  return ""
}

function hasConfigKey(config: Record<string, unknown> | undefined, key: string) {
  return Boolean(config && Object.prototype.hasOwnProperty.call(config, key))
}

export default TopSellingProductsSection
