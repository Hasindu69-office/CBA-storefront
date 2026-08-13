import "server-only"

import { sdk } from "@lib/config"
import type { HomepageCmsSection } from "@lib/data/homepage"
import { getLocale } from "@lib/data/locale-actions"

type CmsSiteSetting = {
  group: string
  key: string
  value: unknown
}

type CmsPageResponse =
  | {
      success: true
      data: {
        page: {
          title: string
          slug: string
          locale: string
          excerpt?: string | null
          body_html?: string | null
          seo?: {
            title?: string | null
            description?: string | null
            canonical_url?: string | null
          }
        }
      }
    }
  | {
      success: false
      error?: { message?: string }
    }

type CmsSectionsResponse =
  | {
      success: true
      data: { sections: HomepageCmsSection[] }
    }
  | {
      success: false
      error?: { message?: string }
    }

type SiteSettingsResponse =
  | {
      success: true
      data: { settings: CmsSiteSetting[] }
    }
  | {
      success: false
      error?: { message?: string }
    }

export type ContactSupportLink = {
  label: string
  description?: string
  url: string
}

export type ContactFaqItem = {
  question: string
  answer: string
}

export type ContactPageContent = {
  page: {
    title: string
    slug: string
    locale: string
    excerpt: string
    body_html: string
    seo: {
      title: string
      description: string
    }
  }
  hero: {
    title: string
    intro: string
    eyebrow: string
  }
  details: {
    phone_label: string
    phone: string
    email_label: string
    email: string
    address_label: string
    address: string
    hours_label: string
    hours: string
  }
  form: {
    title: string
    helper: string
    success_text: string
  }
  support_links: ContactSupportLink[]
  whatsapp: {
    enabled: boolean
    label: string
    phone: string
    prefilled_message: string
  }
  map: {
    enabled: boolean
    label: string
    address: string
  }
  faq: ContactFaqItem[]
}

const DEFAULT_CONTACT: ContactPageContent = {
  page: {
    title: "Contact Us",
    slug: "contact",
    locale: "en",
    excerpt: "Contact Ceylon Business Appliances for sales, service, and order support.",
    body_html: "",
    seo: {
      title: "Contact Us | CBA Ecommerce",
      description:
        "Contact Ceylon Business Appliances for product questions, order help, delivery, and warranty support.",
    },
  },
  hero: {
    title: "Get in touch",
    intro:
      "Questions about products, orders, delivery, or warranty? Send us a message and our team will respond during business hours.",
    eyebrow: "Contact Us",
  },
  details: {
    phone_label: "Phone",
    phone: "011 764 5200",
    email_label: "Email",
    email: "support@cba.lk",
    address_label: "Address",
    address: "193, Hill Street, Dehiwala, Sri Lanka",
    hours_label: "Working hours",
    hours: "Monday – Friday, 9:00 AM – 5:30 PM",
  },
  form: {
    title: "Send a message",
    helper:
      "Share as much detail as you can. We use your contact details only to respond to this inquiry.",
    success_text:
      "Thank you. Your message has been received and our team will get back to you soon.",
  },
  support_links: [
    {
      label: "Track an order",
      description: "View order status and delivery updates.",
      url: "/account/orders",
    },
    {
      label: "Returns & warranty",
      description: "Start or track a return request.",
      url: "/account/returns",
    },
    {
      label: "Frequently asked questions",
      description: "Common answers about shopping with CBA.",
      url: "/contact",
    },
  ],
  whatsapp: {
    enabled: false,
    label: "Chat on WhatsApp",
    phone: "",
    prefilled_message: "Hello CBA, I need help with my order.",
  },
  map: {
    enabled: false,
    label: "Visit our showroom",
    address: "193, Hill Street, Dehiwala, Sri Lanka",
  },
  faq: [],
}

export async function retrieveContactPageContent(): Promise<ContactPageContent> {
  try {
    const locale = await getLocale()
    const query = locale ? { locale } : undefined
    const [pageResponse, sectionsResponse, settingsResponse] =
      await Promise.all([
        sdk.client.fetch<CmsPageResponse>("/store/cba/v1/cms/pages/contact", {
          query,
          cache: "no-store",
        }),
        sdk.client.fetch<CmsSectionsResponse>(
          "/store/cba/v1/cms/pages/contact/sections",
          {
            query,
            cache: "no-store",
          }
        ),
        sdk.client.fetch<SiteSettingsResponse>("/store/cba/v1/site-settings", {
          query: { groups: "contact" },
          cache: "no-store",
        }),
      ])

    if (!pageResponse.success) {
      return DEFAULT_CONTACT
    }

    const sections = sectionsResponse.success
      ? sectionsResponse.data.sections
      : []
    const settings = settingsResponse.success
      ? settingsResponse.data.settings
      : []

    return normalizeContactContent(pageResponse.data.page, sections, settings)
  } catch {
    return DEFAULT_CONTACT
  }
}

type ContactCmsPage = {
  title: string
  slug: string
  locale: string
  excerpt?: string | null
  body_html?: string | null
  seo?: {
    title?: string | null
    description?: string | null
    canonical_url?: string | null
  }
}

function normalizeContactContent(
  page: ContactCmsPage,
  sections: HomepageCmsSection[],
  settings: CmsSiteSetting[]
): ContactPageContent {
  const byType = new Map(sections.map((section) => [section.type, section]))
  const hero = byType.get("contact_hero")
  const detailsSection = byType.get("contact_details")
  const formSection = byType.get("contact_form")
  const supportSection = byType.get("contact_support_links")
  const whatsappSection = byType.get("contact_whatsapp")
  const mapSection = byType.get("contact_map")
  const faqSection = byType.get("contact_faq")
  const contactSettings = objectValue(
    settings.find((item) => item.group === "contact" && item.key === "details")
      ?.value
  )

  const detailsConfig = objectValue(detailsSection?.config)
  const formConfig = objectValue(formSection?.config)
  const whatsappConfig = objectValue(whatsappSection?.config)
  const mapConfig = objectValue(mapSection?.config)
  const heroConfig = objectValue(hero?.config)
  const supportConfig = objectValue(supportSection?.config)
  const faqConfig = objectValue(faqSection?.config)

  return {
    page: {
      title: text(page.title, DEFAULT_CONTACT.page.title),
      slug: text(page.slug, DEFAULT_CONTACT.page.slug),
      locale: text(page.locale, DEFAULT_CONTACT.page.locale),
      excerpt: text(page.excerpt, DEFAULT_CONTACT.page.excerpt),
      body_html: typeof page.body_html === "string" ? page.body_html : "",
      seo: {
        title: text(page.seo?.title, DEFAULT_CONTACT.page.seo.title),
        description: text(
          page.seo?.description,
          DEFAULT_CONTACT.page.seo.description
        ),
      },
    },
    hero: {
      title: text(hero?.title, DEFAULT_CONTACT.hero.title),
      intro: text(
        heroConfig.intro ?? page.excerpt,
        DEFAULT_CONTACT.hero.intro
      ),
      eyebrow: text(heroConfig.eyebrow, DEFAULT_CONTACT.hero.eyebrow),
    },
    details: {
      phone_label: text(
        detailsConfig.phone_label,
        DEFAULT_CONTACT.details.phone_label
      ),
      phone: text(
        detailsConfig.phone ?? contactSettings.phone,
        DEFAULT_CONTACT.details.phone
      ),
      email_label: text(
        detailsConfig.email_label,
        DEFAULT_CONTACT.details.email_label
      ),
      email: text(
        detailsConfig.email ?? contactSettings.email,
        DEFAULT_CONTACT.details.email
      ),
      address_label: text(
        detailsConfig.address_label,
        DEFAULT_CONTACT.details.address_label
      ),
      address: text(
        detailsConfig.address ?? contactSettings.address,
        DEFAULT_CONTACT.details.address
      ),
      hours_label: text(
        detailsConfig.hours_label,
        DEFAULT_CONTACT.details.hours_label
      ),
      hours: text(
        detailsConfig.hours ?? contactSettings.hours,
        DEFAULT_CONTACT.details.hours
      ),
    },
    form: {
      title: text(formSection?.title, DEFAULT_CONTACT.form.title),
      helper: text(formConfig.helper, DEFAULT_CONTACT.form.helper),
      success_text: text(
        formConfig.success_text,
        DEFAULT_CONTACT.form.success_text
      ),
    },
    support_links: normalizeSupportLinks(supportConfig.links),
    whatsapp: {
      enabled: Boolean(whatsappConfig.enabled) && Boolean(text(whatsappConfig.phone, "")),
      label: text(whatsappConfig.label, DEFAULT_CONTACT.whatsapp.label),
      phone: text(whatsappConfig.phone, ""),
      prefilled_message: text(
        whatsappConfig.prefilled_message,
        DEFAULT_CONTACT.whatsapp.prefilled_message
      ),
    },
    map: {
      enabled: Boolean(mapConfig.enabled),
      label: text(mapConfig.label, DEFAULT_CONTACT.map.label),
      address: text(mapConfig.address, DEFAULT_CONTACT.map.address),
    },
    faq: normalizeFaqItems(faqConfig.items),
  }
}

function normalizeSupportLinks(value: unknown): ContactSupportLink[] {
  if (!Array.isArray(value)) {
    return DEFAULT_CONTACT.support_links
  }

  const links: ContactSupportLink[] = []
  for (const item of value) {
    const row = objectValue(item)
    const label = text(row.label, "")
    const url = safePath(row.url)
    if (!label || !url) continue
    const description = text(row.description, "")
    links.push({
      label,
      url,
      ...(description ? { description } : {}),
    })
  }

  return links.length ? links : DEFAULT_CONTACT.support_links
}

function normalizeFaqItems(value: unknown): ContactFaqItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      const row = objectValue(item)
      const question = text(row.question, "")
      const answer = text(row.answer, "")
      return question && answer ? { question, answer } : null
    })
    .filter((item): item is ContactFaqItem => Boolean(item))
}

function objectValue(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {}
}

function text(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

function safePath(value: unknown) {
  if (typeof value !== "string") return ""
  const path = value.trim()
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : ""
}
