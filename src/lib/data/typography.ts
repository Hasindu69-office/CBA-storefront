import "server-only"

import { MEDUSA_BACKEND_URL } from "@lib/config"
import { getLocale } from "@lib/data/locale-actions"
import {
  defaultTypography,
  normalizeStorefrontTypography,
  normalizeTypographyLocale,
  type StorefrontTypography,
} from "@lib/util/typography"

type Envelope = { success: true; data: unknown } | { success: false }

export async function getStorefrontTypography(): Promise<StorefrontTypography> {
  const locale = normalizeTypographyLocale(await getLocale())
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2500)
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL.replace(/\/+$/, "")}/store/cba/v1/typography?locale=${locale}`, {
      headers: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        ? { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY }
        : undefined,
      cache: "no-store",
      signal: controller.signal,
    })
    if (!response.ok) return defaultTypography(locale)
    const payload = await response.json() as Envelope
    return payload.success ? normalizeStorefrontTypography(payload.data, locale) : defaultTypography(locale)
  } catch {
    return defaultTypography(locale)
  } finally { clearTimeout(timer) }
}
