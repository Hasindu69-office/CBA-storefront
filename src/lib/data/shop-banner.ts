import { sdk } from "@lib/config"
import type { HomepageCmsSection } from "@lib/data/homepage"
import { listProductCardsByIds } from "@lib/data/tabbed-sale-products"
import { convertToLocale } from "@lib/util/money"

export type ShopBannerContent = {
  title: string
  subtitle: string
  breadcrumbLabel: string
  backgroundImageUrl: string
  backgroundAltText: string
}

export type ShopSidebarPromoContent = {
  title: string
  eyebrow: string
  priceText: string
  imageUrl: string
  imageAltText: string
  href: string
}

export type ShopPageContent = {
  banner: ShopBannerContent
  sidebarPromo: ShopSidebarPromoContent | null
}

type ShopSectionsResponse =
  | {
      success: true
      data: { sections: HomepageCmsSection[] }
    }
  | {
      success: false
      error: { message: string }
    }

export const SHOP_BANNER_FALLBACK: ShopBannerContent = {
  title: "Shop",
  subtitle: "Most Popular products chosen by business like you.",
  breadcrumbLabel: "Shop",
  backgroundImageUrl: "/images/storebackgroundbanner.png",
  backgroundAltText: "Office equipment shop banner",
}

export const SHOP_SIDEBAR_PROMO_FALLBACK: ShopSidebarPromoContent = {
  title: "OKODo hero 11+ 5K wireless",
  eyebrow: "FROM",
  priceText: "Rs. 70,000",
  imageUrl: "/images/storepagebanner.png",
  imageAltText: "OKODo hero 11 plus wireless camera promo",
  href: "/store",
}

export async function listShopPageContent(): Promise<ShopPageContent> {
  try {
    const payload = await sdk.client.fetch<ShopSectionsResponse>(
      "/store/cba/v1/cms/pages/shop/sections",
      { cache: "no-store" }
    )

    if (!payload.success) {
      return {
        banner: SHOP_BANNER_FALLBACK,
        sidebarPromo: SHOP_SIDEBAR_PROMO_FALLBACK,
      }
    }

    const section = payload.data.sections.find(
      (item) =>
        item.type === "promo_banner" &&
        item.config?.placement === "shop_banner"
    )
    const sidebarPromoSection = payload.data.sections.find(
      (item) =>
        item.type === "promo_banner" &&
        item.config?.placement === "shop_sidebar_promo"
    )
    const sidebarPromo = await parseSidebarPromo(sidebarPromoSection)

    if (!section?.title) {
      return {
        banner: SHOP_BANNER_FALLBACK,
        sidebarPromo,
      }
    }

    return {
      banner: {
        title: safeText(section.title, SHOP_BANNER_FALLBACK.title),
        subtitle: safeText(
          section.config?.subtitle,
          SHOP_BANNER_FALLBACK.subtitle
        ),
        breadcrumbLabel: safeText(
          section.config?.breadcrumb_label,
          SHOP_BANNER_FALLBACK.breadcrumbLabel
        ),
        backgroundImageUrl: safeImageUrl(
          section.config?.background_image_url,
          SHOP_BANNER_FALLBACK.backgroundImageUrl
        ),
        backgroundAltText: safeText(
          section.config?.background_alt_text,
          SHOP_BANNER_FALLBACK.backgroundAltText
        ),
      },
      sidebarPromo,
    }
  } catch {
    return {
      banner: SHOP_BANNER_FALLBACK,
      sidebarPromo: SHOP_SIDEBAR_PROMO_FALLBACK,
    }
  }
}

export async function listShopBannerContent(): Promise<ShopBannerContent> {
  return (await listShopPageContent()).banner
}

function safeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function safeImageUrl(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback
  }
  const url = value.trim()
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url
  }
  if (/^https?:\/\//i.test(url)) {
    return url
  }
  return fallback
}

function parseSidebarPromo(
  section?: HomepageCmsSection
): Promise<ShopSidebarPromoContent | null> {
  if (!section?.config) {
    return Promise.resolve(SHOP_SIDEBAR_PROMO_FALLBACK)
  }
  const config = section.config
  const title = safeText(config.title, "")
  const href = safeStorefrontPath(config.href)
  if (!title || !href) {
    return Promise.resolve(SHOP_SIDEBAR_PROMO_FALLBACK)
  }
  return resolveSidebarPromoPrice(config.product_id).then((priceText) => ({
    title,
    href,
    eyebrow: safeText(config.eyebrow, "FROM"),
    priceText,
    imageUrl: safeImageUrl(config.image_url, ""),
    imageAltText: safeText(config.image_alt_text, title),
  }))
}

async function resolveSidebarPromoPrice(productId: unknown) {
  if (typeof productId !== "string" || !productId.trim()) {
    return ""
  }
  const [product] = await listProductCardsByIds([productId]).catch(() => [])
  if (
    !product ||
    product.price.status !== "available" ||
    product.price.calculated_amount === null
  ) {
    return ""
  }
  return convertToLocale({
    amount: product.price.calculated_amount,
    currency_code: product.price.currency_code,
    maximumFractionDigits: 2,
  })
}

function safeStorefrontPath(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }
  const path = value.trim()
  return path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : ""
}
