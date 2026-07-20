import { sdk } from "@lib/config"

export type HomepageCmsItem = {
  title?: string | null
  subtitle?: string | null
  body_html?: string | null
  reference_type?: string | null
  reference_id?: string | null
  url?: string | null
  media_url?: string | null
  media_alt_text?: string | null
  media?: {
    url: string
    alt_text?: string | null
    metadata?: Record<string, unknown> | null
  } | null
  config?: Record<string, unknown>
  sort_order: number
}

export type HomepageCmsSection = {
  type: string
  title?: string | null
  config?: Record<string, unknown>
  sort_order: number
  items: HomepageCmsItem[]
  updated_at?: string
}

export type HomepageContent = {
  page: {
    title: string
    slug: string
    locale: string
  } | null
  sections: HomepageCmsSection[]
}

type HomepageResponse =
  | {
      success: true
      data: HomepageContent
    }
  | {
      success: false
      error: {
        message: string
      }
    }

export const listHomepageContent = async () => {
  return sdk.client
    .fetch<HomepageResponse>("/store/cba/v1/homepage", {
      cache: "no-store",
    })
    .then((payload) => {
      if (!payload.success) {
        throw new Error(payload.error?.message ?? "Homepage request failed.")
      }

      return payload.data
    })
}
