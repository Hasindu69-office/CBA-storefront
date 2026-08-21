import "server-only"

import { sdk } from "@lib/config"
import { getLocale } from "@lib/data/locale-actions"
import type { HomepageCmsSection } from "@lib/data/homepage"
import { isValidCmsSlug, safeCmsUrl } from "@lib/util/cms-pages"

type StoreCmsPage = {
  title: string
  slug: string
  locale: string
  template_key?: string | null
  excerpt?: string | null
  body_html?: string | null
  seo?: {
    title?: string | null
    description?: string | null
    canonical_url?: string | null
  }
  updated_at?: string
}

type CmsPageResponse =
  | {
      success: true
      data: { page: StoreCmsPage }
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

export type CmsPageContent = {
  page: {
    title: string
    slug: string
    locale: string
    template_key: CmsPageTemplateKey
    excerpt: string
    body_html: string
    seo: {
      title: string
      description: string
      canonical_url: string
    }
  }
  sections: HomepageCmsSection[]
}

export type CmsPageTemplateKey = "page" | "policy" | "landing"

export async function retrieveCmsPageContent(
  slug: string
): Promise<CmsPageContent | null> {
  if (!isValidCmsSlug(slug)) {
    return null
  }

  try {
    const locale = await getLocale()
    const query = locale ? { locale } : undefined
    const [pageResponse, sectionsResponse] = await Promise.all([
      sdk.client.fetch<CmsPageResponse>(
        `/store/cba/v1/cms/pages/${encodeURIComponent(slug)}`,
        {
          query,
          cache: "no-store",
        }
      ),
      sdk.client.fetch<CmsSectionsResponse>(
        `/store/cba/v1/cms/pages/${encodeURIComponent(slug)}/sections`,
        {
          query,
          cache: "no-store",
        }
      ),
    ])

    if (!pageResponse.success) {
      return null
    }

    return normalizeCmsPageContent(
      pageResponse.data.page,
      sectionsResponse.success ? sectionsResponse.data.sections : []
    )
  } catch (error) {
    logCmsPageError("CMS page request failed.", { slug, error })
    return null
  }
}

function normalizeCmsPageContent(
  page: StoreCmsPage,
  sections: HomepageCmsSection[]
): CmsPageContent | null {
  if (!isValidCmsSlug(page.slug) || !text(page.title)) {
    return null
  }

  const excerpt = text(page.excerpt)
  return {
    page: {
      title: text(page.title),
      slug: page.slug,
      locale: text(page.locale) || "en",
      template_key: normalizeTemplateKey(page.template_key),
      excerpt,
      body_html: text(page.body_html),
      seo: {
        title: text(page.seo?.title) || text(page.title),
        description: text(page.seo?.description) || excerpt,
        canonical_url: safeCmsUrl(page.seo?.canonical_url),
      },
    },
    sections: normalizeContentRichTextSections(sections),
  }
}

function normalizeTemplateKey(value: unknown): CmsPageTemplateKey {
  return value === "policy" || value === "landing" || value === "page"
    ? value
    : "page"
}

function normalizeContentRichTextSections(
  sections: HomepageCmsSection[]
): HomepageCmsSection[] {
  if (!Array.isArray(sections)) {
    return []
  }

  return sections
    .filter((section) => section?.type === "content_rich_text")
    .map((section) => ({
      ...section,
      title: text(section.title),
      sort_order: Number.isInteger(section.sort_order) ? section.sort_order : 0,
      items: Array.isArray(section.items)
        ? section.items
            .map((item) => ({
              ...item,
              title: text(item.title),
              subtitle: text(item.subtitle),
              body_html: text(item.body_html),
              url: safeCmsUrl(item.url),
              media_url: safeCmsUrl(item.media_url ?? item.media?.url),
              media_alt_text: text(
                item.media_alt_text ?? item.media?.alt_text ?? item.title
              ),
              sort_order: Number.isInteger(item.sort_order) ? item.sort_order : 0,
            }))
            .sort((left, right) => left.sort_order - right.sort_order)
        : [],
    }))
    .sort((left, right) => left.sort_order - right.sort_order)
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function logCmsPageError(message: string, context: Record<string, unknown>) {
  if (process.env.NODE_ENV === "test") {
    return
  }

  console.warn("[cba-cms-page]", message, sanitizeLogContext(context))
}

function sanitizeLogContext(context: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (value instanceof Error) {
        return [key, value.message]
      }
      return [key, value]
    })
  )
}
