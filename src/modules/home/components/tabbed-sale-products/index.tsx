import {
  listProductCardsByIds,
  listTabbedSaleProductCards,
  type TabbedSaleProductSourceType,
} from "@lib/data/tabbed-sale-products"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import type { HomepageCmsSection } from "@lib/data/homepage"
import TabbedSaleProductsClient from "./tabbed-sale-products-client"

type TabbedSaleProductsSectionProps = {
  sections: HomepageCmsSection[]
}

export type TabbedSaleTabKey =
  | "featured"
  | "new_arrivals"
  | "best_sellers"
  | "top_rated"

export type TabbedSaleTab = {
  key: TabbedSaleTabKey
  label: string
  products: FeaturedProductCard[]
}

export type TabbedSalePoint = {
  label: string
  icon: string
}

export type TabbedSaleBanner = {
  eyebrow: string
  headline: string
  description: string
  points: TabbedSalePoint[]
  ctaLabel: string
  ctaUrl: string
  offerEndsAt: string | null
  imageUrl: string | null
  backgroundUrl: string
  imageAlt: string
  product: FeaturedProductCard | null
}

export type TabbedSaleProductsVisibility = {
  banner: boolean
  tabs: boolean
}

const PLACEMENT = "homepage_tabbed_sale_products"
const DEFAULT_LIMIT = 4
const MAX_LIMIT = 8
const TAB_CONFIG: Array<{ key: TabbedSaleTabKey; label: string }> = [
  { key: "featured", label: "Featured" },
  { key: "new_arrivals", label: "New Arrivals" },
  { key: "best_sellers", label: "Best Sellers" },
  { key: "top_rated", label: "Top Rated" },
]

const TabbedSaleProductsSection = async ({
  sections,
}: TabbedSaleProductsSectionProps) => {
  const section = sections.find(isTabbedSaleSection)
  if (!section) {
    return null
  }

  const visibility = visibilityFromConfig(section.config)
  if (!visibility.banner && !visibility.tabs) {
    return null
  }

  const limit = limitConfig(section.config?.limit)
  const tabs = visibility.tabs
    ? await Promise.all(
        TAB_CONFIG.map(async (tab) => {
          const tabConfig = tabSourceConfig(section.config?.tabs, tab.key)

          const products = await listTabbedSaleProductCards({
            tabKey: tab.key,
            sourceType: tabConfig.sourceType,
            sourceId: tabConfig.sourceId,
            limit,
          }).catch(() => [])

          return { ...tab, products }
        })
      )
    : []

  const firstProduct =
    tabs.flatMap((tab) => tab.products).find(Boolean) ?? null
  if (visibility.tabs && !firstProduct && !section.config) {
    return null
  }

  const bannerProductId = stringConfig(section.config?.banner_product_id)
  const bannerProduct = visibility.banner && bannerProductId
    ? await listProductCardsByIds([bannerProductId])
        .then((products) => products[0] ?? null)
        .catch(() => null)
    : null

  const banner = bannerFromSection(section, {
    bannerProduct,
    firstProduct,
  })

  return (
    <TabbedSaleProductsClient
      banner={banner}
      tabs={tabs}
      visibility={visibility}
    />
  )
}

function isTabbedSaleSection(section: HomepageCmsSection) {
  return (
    section.type === "product_tabs" &&
    section.config?.placement === PLACEMENT
  )
}

function bannerFromSection(
  section: HomepageCmsSection,
  products: {
    bannerProduct: FeaturedProductCard | null
    firstProduct: FeaturedProductCard | null
  }
): TabbedSaleBanner {
  const config = section.config ?? {}
  const bannerProduct = products.bannerProduct
  const firstProduct = products.firstProduct
  const imageUrl =
    stringConfig(config.banner_media_url) ||
    bannerProduct?.thumbnail?.url ||
    firstProduct?.thumbnail?.url ||
    null
  return {
    eyebrow: stringConfig(config.eyebrow) || "Deal of the Day",
    headline: stringConfig(config.headline) || section.title?.trim() || "Sale Products",
    description:
      stringConfig(config.description) ||
      "Premium performance, limited time offer.",
    points: pointsConfig(config.points),
    ctaLabel: stringConfig(config.cta_label) || "Shop Now",
    ctaUrl: safeHrefConfig(config.cta_url) || "/store",
    offerEndsAt:
      isoDateConfig(config.offer_ends_at) ||
      isoDateConfig(config.banner_effective_offer_ends_at) ||
      isoDateConfig(bannerProduct?.price.sale_ends_at),
    imageUrl,
    backgroundUrl:
      stringConfig(config.banner_background_url) ||
      "/images/bannerimgbackground.png",
    imageAlt:
      stringConfig(config.banner_media_alt) ||
      bannerProduct?.thumbnail?.alt ||
      bannerProduct?.title ||
      firstProduct?.thumbnail?.alt ||
      firstProduct?.title ||
      "Sale product image",
    product: bannerProduct,
  }
}

function visibilityFromConfig(config: HomepageCmsSection["config"]): TabbedSaleProductsVisibility {
  return {
    banner: config?.banner_visibility !== "hidden",
    tabs: config?.tabs_visibility !== "hidden",
  }
}

function tabSourceConfig(value: unknown, key: TabbedSaleTabKey) {
  const tabs = objectConfig(value)
  const tab = objectConfig(tabs[key])
  return {
    sourceType: sourceTypeConfig(tab.source_type),
    sourceId: sourceIdConfig(key, tab.source_type, tab.source_id),
  }
}

function sourceIdConfig(
  key: TabbedSaleTabKey,
  sourceType: unknown,
  sourceId: unknown
) {
  const id = stringConfig(sourceId)
  if (!id || sourceType !== "badge") {
    return id
  }
  const defaultBadgeByTab: Record<TabbedSaleTabKey, string> = {
    featured: "featured",
    new_arrivals: "new-arrival",
    best_sellers: "best-seller",
    top_rated: "top-rated",
  }
  return id.trim().toLowerCase() === defaultBadgeByTab[key] ? "" : id
}

function sourceTypeConfig(value: unknown): TabbedSaleProductSourceType {
  if (value === "category" || value === "brand" || value === "badge") {
    return value
  }
  return "badge"
}

function pointsConfig(value: unknown): TabbedSalePoint[] {
  if (!Array.isArray(value)) {
    return [
      { label: "High Speed Performance", icon: "rocket" },
      { label: "Reliable & Durable", icon: "shield" },
      { label: "Expert Support", icon: "headphones" },
    ]
  }
  return value
    .slice(0, 3)
    .map((item) => {
      const row = objectConfig(item)
      return {
        label: stringConfig(row.label),
        icon: stringConfig(row.icon) || "zap",
      }
    })
    .filter((item) => item.label)
}

function limitConfig(value: unknown) {
  const parsed = Number(value ?? DEFAULT_LIMIT)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_LIMIT
    ? parsed
    : DEFAULT_LIMIT
}

function isoDateConfig(value: unknown) {
  const text = stringConfig(value)
  if (!text) {
    return null
  }
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
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

function stringConfig(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

function objectConfig(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export default TabbedSaleProductsSection
