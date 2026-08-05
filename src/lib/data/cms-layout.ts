import "server-only"

import { sdk } from "@lib/config"
import { getLocale } from "@lib/data/locale-actions"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

type CmsSiteSetting = {
  group: string
  key: string
  value: unknown
}

type SiteSettingsResponse =
  | {
      success: true
      data: {
        settings: CmsSiteSetting[]
      }
    }
  | {
      success: false
      error?: {
        message?: string
      }
    }

export type CmsNavigationItem = {
  label?: string | null
  reference_type?: string | null
  reference_id?: string | null
  url?: string | null
  sort_order?: number | null
  children?: CmsNavigationItem[]
}

type NavigationResponse =
  | {
      success: true
      data: {
        menu: {
          items: CmsNavigationItem[]
        } | null
      }
    }
  | {
      success: false
      error?: {
        message?: string
      }
    }

export type LayoutLink = {
  label: string
  href: string
}

export type FooterColumn = LayoutLink & {
  links: LayoutLink[]
}

export type HeaderLayoutSettings = {
  logo: {
    image_url: string
    alt_text: string
    href: string
  }
  help: {
    label: string
    phone: string
    support_label: string
    support_url: string
  }
  topbar: {
    delivery_label: string
    language_label: string
    track_order_label: string
    track_order_url: string
    currency_label: string
  }
  commerce: {
    account_label: string
    account_hint: string
    wishlist_label: string
    cart_label: string
    all_categories_label: string
    deals_label: string
    deals_url: string
  }
}

export type FooterLayoutSettings = {
  company: {
    logo_url: string
    logo_alt_text: string
    name: string
    address: string
    description: string
  }
  newsletter: {
    enabled: boolean
    title: string
    description: string
  }
  copyright: {
    text: string
  }
  payment: {
    image_url: string
    image_alt_text: string
  }
  social: {
    links: LayoutLink[]
  }
}

export type CmsLayoutContent = {
  header: HeaderLayoutSettings
  footer: FooterLayoutSettings
  headerMenuItems: CmsNavigationItem[]
  footerMenuItems: CmsNavigationItem[]
}

export const DEFAULT_HEADER_LAYOUT: HeaderLayoutSettings = {
  logo: {
    image_url: "/images/ebizCBAlogo.png",
    alt_text: "CBA ebiz logo",
    href: "/",
  },
  help: {
    label: "Need Help ?",
    phone: "011 764 5200",
    support_label: "Support",
    support_url: "/contact-us",
  },
  topbar: {
    delivery_label: "Delivery Islandwide",
    language_label: "English",
    track_order_label: "Track Order",
    track_order_url: "/track-order",
    currency_label: "LKR",
  },
  commerce: {
    account_label: "Account",
    account_hint: "Sign In / Register",
    wishlist_label: "Wishlist",
    cart_label: "Cart",
    all_categories_label: "All Categories",
    deals_label: "Deals",
    deals_url: "/store",
  },
}

export const DEFAULT_FOOTER_LAYOUT: FooterLayoutSettings = {
  company: {
    logo_url: "/images/Logo - White.png",
    logo_alt_text: "CBA Logo",
    name: "Ceylon Business Appliances (Pvt) Ltd",
    address: "193, Hill Street, Dehiwala, Sri Lanka",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  newsletter: {
    enabled: true,
    title: "Subscribe to our newsletter",
    description:
      "Subscribe to our mailing list for news, updates, and exclusive offers.",
  },
  copyright: {
    text: "Ceylon Business Appliance. All Rights Reserved.",
  },
  payment: {
    image_url: "/images/paymentmethods.png",
    image_alt_text: "Accepted payment methods",
  },
  social: {
    links: [
      { label: "Facebook", href: "#" },
      { label: "Twitter", href: "#" },
      { label: "Google", href: "#" },
      { label: "Instagram", href: "#" },
      { label: "LinkedIn", href: "#" },
    ],
  },
}

export const retrieveCmsLayout = cache(async (): Promise<CmsLayoutContent> => {
  try {
    const locale = await getLocale()
    const [settingsResponse, headerResponse, footerResponse] = await Promise.all([
      sdk.client.fetch<SiteSettingsResponse>("/store/cba/v1/site-settings", {
        query: { groups: "header,footer,social" },
        cache: "no-store",
      }),
      sdk.client.fetch<NavigationResponse>("/store/cba/v1/navigation/header", {
        query: locale ? { locale } : undefined,
        cache: "no-store",
      }),
      sdk.client.fetch<NavigationResponse>("/store/cba/v1/navigation/footer", {
        query: locale ? { locale } : undefined,
        cache: "no-store",
      }),
    ])

    if (!settingsResponse.success) {
      throw new Error(settingsResponse.error?.message ?? "CMS layout request failed.")
    }

    return {
      header: normalizeHeaderSettings(settingsResponse.data.settings),
      footer: normalizeFooterSettings(settingsResponse.data.settings),
      headerMenuItems: headerResponse.success
        ? normalizeMenuItems(headerResponse.data.menu?.items)
        : [],
      footerMenuItems: footerResponse.success
        ? normalizeMenuItems(footerResponse.data.menu?.items)
        : [],
    }
  } catch {
    return {
      header: DEFAULT_HEADER_LAYOUT,
      footer: DEFAULT_FOOTER_LAYOUT,
      headerMenuItems: [],
      footerMenuItems: [],
    }
  }
})

export function navigationItemsToLinks(
  items: CmsNavigationItem[],
  categories: HttpTypes.StoreProductCategory[],
  fallback: LayoutLink[]
): LayoutLink[] {
  const links = items
    .map((item) => navigationItemToLink(item, categories))
    .filter((item): item is LayoutLink => Boolean(item))

  return links.length ? links : fallback
}

export function footerItemsToColumns(
  items: CmsNavigationItem[],
  categories: HttpTypes.StoreProductCategory[],
  fallback: FooterColumn[]
): FooterColumn[] {
  const columns = items
    .map((item) => {
      const column = navigationItemToLink(item, categories)
      if (!column) {
        return null
      }

      return {
        ...column,
        links: navigationItemsToLinks(item.children ?? [], categories, []),
      }
    })
    .filter((item): item is FooterColumn => Boolean(item))

  return columns.length ? columns : fallback
}

function normalizeHeaderSettings(settings: CmsSiteSetting[]): HeaderLayoutSettings {
  return {
    logo: {
      ...DEFAULT_HEADER_LAYOUT.logo,
      ...pickObjectSetting(settings, "header", "logo"),
      image_url: imageUrl(
        pickObjectSetting(settings, "header", "logo").image_url,
        DEFAULT_HEADER_LAYOUT.logo.image_url
      ),
      href: safeUrl(
        pickObjectSetting(settings, "header", "logo").href,
        DEFAULT_HEADER_LAYOUT.logo.href
      ),
      alt_text: text(
        pickObjectSetting(settings, "header", "logo").alt_text,
        DEFAULT_HEADER_LAYOUT.logo.alt_text
      ),
    },
    help: {
      label: text(
        pickObjectSetting(settings, "header", "help").label,
        DEFAULT_HEADER_LAYOUT.help.label
      ),
      phone: text(
        pickObjectSetting(settings, "header", "help").phone,
        DEFAULT_HEADER_LAYOUT.help.phone
      ),
      support_label: text(
        pickObjectSetting(settings, "header", "help").support_label,
        DEFAULT_HEADER_LAYOUT.help.support_label
      ),
      support_url: safeUrl(
        pickObjectSetting(settings, "header", "help").support_url,
        DEFAULT_HEADER_LAYOUT.help.support_url
      ),
    },
    topbar: {
      delivery_label: text(
        pickObjectSetting(settings, "header", "topbar").delivery_label,
        DEFAULT_HEADER_LAYOUT.topbar.delivery_label
      ),
      language_label: text(
        pickObjectSetting(settings, "header", "topbar").language_label,
        DEFAULT_HEADER_LAYOUT.topbar.language_label
      ),
      track_order_label: text(
        pickObjectSetting(settings, "header", "topbar").track_order_label,
        DEFAULT_HEADER_LAYOUT.topbar.track_order_label
      ),
      track_order_url: safeUrl(
        pickObjectSetting(settings, "header", "topbar").track_order_url,
        DEFAULT_HEADER_LAYOUT.topbar.track_order_url
      ),
      currency_label: text(
        pickObjectSetting(settings, "header", "topbar").currency_label,
        DEFAULT_HEADER_LAYOUT.topbar.currency_label
      ),
    },
    commerce: {
      account_label: text(
        pickObjectSetting(settings, "header", "commerce_labels").account_label,
        DEFAULT_HEADER_LAYOUT.commerce.account_label
      ),
      account_hint: text(
        pickObjectSetting(settings, "header", "commerce_labels").account_hint,
        DEFAULT_HEADER_LAYOUT.commerce.account_hint
      ),
      wishlist_label: text(
        pickObjectSetting(settings, "header", "commerce_labels").wishlist_label,
        DEFAULT_HEADER_LAYOUT.commerce.wishlist_label
      ),
      cart_label: text(
        pickObjectSetting(settings, "header", "commerce_labels").cart_label,
        DEFAULT_HEADER_LAYOUT.commerce.cart_label
      ),
      all_categories_label: text(
        pickObjectSetting(settings, "header", "commerce_labels").all_categories_label,
        DEFAULT_HEADER_LAYOUT.commerce.all_categories_label
      ),
      deals_label: text(
        pickObjectSetting(settings, "header", "commerce_labels").deals_label,
        DEFAULT_HEADER_LAYOUT.commerce.deals_label
      ),
      deals_url: safeUrl(
        pickObjectSetting(settings, "header", "commerce_labels").deals_url,
        DEFAULT_HEADER_LAYOUT.commerce.deals_url
      ),
    },
  }
}

function normalizeFooterSettings(settings: CmsSiteSetting[]): FooterLayoutSettings {
  const company = pickObjectSetting(settings, "footer", "company")
  const newsletter = pickObjectSetting(settings, "footer", "newsletter")
  const copyright = pickObjectSetting(settings, "footer", "copyright")
  const payment = pickObjectSetting(settings, "footer", "payment")
  const social = pickObjectSetting(settings, "social", "links")

  return {
    company: {
      logo_url: imageUrl(company.logo_url, DEFAULT_FOOTER_LAYOUT.company.logo_url),
      logo_alt_text: text(
        company.logo_alt_text,
        DEFAULT_FOOTER_LAYOUT.company.logo_alt_text
      ),
      name: text(company.name, DEFAULT_FOOTER_LAYOUT.company.name),
      address: text(company.address, DEFAULT_FOOTER_LAYOUT.company.address),
      description: text(
        company.description,
        DEFAULT_FOOTER_LAYOUT.company.description
      ),
    },
    newsletter: {
      enabled:
        typeof newsletter.enabled === "boolean"
          ? newsletter.enabled
          : DEFAULT_FOOTER_LAYOUT.newsletter.enabled,
      title: text(newsletter.title, DEFAULT_FOOTER_LAYOUT.newsletter.title),
      description: text(
        newsletter.description,
        DEFAULT_FOOTER_LAYOUT.newsletter.description
      ),
    },
    copyright: {
      text: text(copyright.text, DEFAULT_FOOTER_LAYOUT.copyright.text),
    },
    payment: {
      image_url: imageUrl(payment.image_url, DEFAULT_FOOTER_LAYOUT.payment.image_url),
      image_alt_text: text(
        payment.image_alt_text,
        DEFAULT_FOOTER_LAYOUT.payment.image_alt_text
      ),
    },
    social: {
      links: normalizeSocialLinks(social.links),
    },
  }
}

function normalizeSocialLinks(value: unknown): LayoutLink[] {
  if (!Array.isArray(value)) {
    return DEFAULT_FOOTER_LAYOUT.social.links
  }

  const links = value
    .map((item) => {
      const row = objectValue(item)
      const label = text(row.label, "")
      const href = safeUrl(row.url, "")

      return label && href ? { label, href } : null
    })
    .filter((item): item is LayoutLink => Boolean(item))
    .slice(0, 8)

  return links.length ? links : DEFAULT_FOOTER_LAYOUT.social.links
}

function normalizeMenuItems(value: unknown): CmsNavigationItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item): CmsNavigationItem | null => {
      const row = objectValue(item)
      const label = text(row.label, "")

      if (!label) {
        return null
      }

      return {
        label,
        reference_type: text(row.reference_type, ""),
        reference_id: text(row.reference_id, ""),
        url: safeUrl(row.url, ""),
        sort_order: typeof row.sort_order === "number" ? row.sort_order : 0,
        children: normalizeMenuItems(row.children),
      }
    })
    .filter((item): item is CmsNavigationItem => Boolean(item))
}

function navigationItemToLink(
  item: CmsNavigationItem,
  categories: HttpTypes.StoreProductCategory[]
): LayoutLink | null {
  const label = text(item.label, "")
  const href =
    safeUrl(item.url, "") ||
    categoryHref(item.reference_type, item.reference_id, categories)

  return label && href ? { label, href } : null
}

function categoryHref(
  referenceType: string | null | undefined,
  referenceId: string | null | undefined,
  categories: HttpTypes.StoreProductCategory[]
) {
  if (referenceType !== "category" || !referenceId) {
    return ""
  }

  const category = categories.find((item) => item.id === referenceId)
  return category?.handle ? `/categories/${category.handle}` : ""
}

function pickObjectSetting(settings: CmsSiteSetting[], group: string, key: string) {
  return objectValue(
    settings.find((item) => item.group === group && item.key === key)?.value
  )
}

function objectValue(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {}
}

function text(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : fallback
}

function imageUrl(value: unknown, fallback: string) {
  const url = safeUrl(value, "")

  if (!url) {
    return fallback
  }

  return url.startsWith("/") || /^https?:\/\//i.test(url) ? url : fallback
}

function safeUrl(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback
  }

  const url = value.trim()
  if (!url) {
    return fallback
  }

  if (url.startsWith("#") && /^#[A-Za-z0-9_-]+$/.test(url)) {
    return url
  }

  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url
  }

  try {
    const parsed = new URL(url)
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : fallback
  } catch {
    return fallback
  }
}
