import { sdk } from "@lib/config"
import type { HomepageCmsSection } from "@lib/data/homepage"

export type PdpSidebarBanner = {
  placement: "primary" | "secondary"
  imageUrl: string
  imageAltText: string
  href: string | null
}

export type PdpBannerContent = {
  primary: PdpSidebarBanner | null
  secondary: PdpSidebarBanner | null
}

type PdpSectionsResponse =
  | {
      success: true
      data: { sections: HomepageCmsSection[] }
    }
  | {
      success: false
      error: { message: string }
    }

const PDP_PAGE_SLUG = "product-detail"
const PRIMARY_PLACEMENT = "pdp_sidebar_banner_primary"
const SECONDARY_PLACEMENT = "pdp_sidebar_banner_secondary"

export async function listPdpBannerContent(): Promise<PdpBannerContent> {
  try {
    const payload = await sdk.client.fetch<PdpSectionsResponse>(
      `/store/cba/v1/cms/pages/${PDP_PAGE_SLUG}/sections`,
      { cache: "no-store" }
    )

    if (!payload.success) {
      return { primary: null, secondary: null }
    }

    const primarySection = payload.data.sections.find(
      (item) =>
        item.type === "promo_banner" &&
        item.config?.placement === PRIMARY_PLACEMENT
    )
    const secondarySection = payload.data.sections.find(
      (item) =>
        item.type === "promo_banner" &&
        item.config?.placement === SECONDARY_PLACEMENT
    )

    return {
      primary: parseBannerSection(primarySection, "primary"),
      secondary: parseBannerSection(secondarySection, "secondary"),
    }
  } catch {
    return { primary: null, secondary: null }
  }
}

function parseBannerSection(
  section: HomepageCmsSection | undefined,
  placement: PdpSidebarBanner["placement"]
): PdpSidebarBanner | null {
  if (!section?.config) {
    return null
  }

  const imageUrl = safeImageUrl(section.config.image_url)
  const imageAltText = safeText(section.config.image_alt_text)
  if (!imageUrl || !imageAltText) {
    return null
  }

  const href = safeStorefrontPath(section.config.href)

  return {
    placement,
    imageUrl,
    imageAltText,
    href,
  }
}

function safeText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

function safeImageUrl(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }
  const url = value.trim()
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url
  }
  if (/^https?:\/\//i.test(url)) {
    return url
  }
  return ""
}

function safeStorefrontPath(value: unknown) {
  if (typeof value !== "string") {
    return null
  }
  const path = value.trim()
  return path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : null
}
