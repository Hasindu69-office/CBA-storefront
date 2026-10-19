export type TypographyLocale = "en" | "si" | "ta"
export type ResolvedFont = {
  source: "google" | "custom"
  family: string
  display_name: string
  category: string
  family_id?: string
}
export type TypographyFace = {
  family: string
  asset_id: string
  format: "woff2" | "otf" | "ttf"
  style: "normal" | "italic"
  weight_min: number
  weight_max: number
}
export type StorefrontTypography = {
  locale: TypographyLocale
  revision: string
  heading: ResolvedFont
  body: ResolvedFont
  google_stylesheet_url: string | null
  custom_faces: TypographyFace[]
}

const LOCAL_DEFAULTS: Record<TypographyLocale, string> = {
  en: "Inter Variable",
  si: "Noto Sans Sinhala Variable",
  ta: "Noto Sans Tamil Variable",
}
const SAFE_FAMILY = /^[A-Za-z0-9 _.-]{1,120}$/
const SAFE_ASSET = /^[a-f0-9]{32}$/

export function normalizeTypographyLocale(value: unknown): TypographyLocale {
  const locale = String(value || "en").trim().toLowerCase().split(/[-_]/, 1)[0]
  return locale === "si" || locale === "ta" ? locale : "en"
}

export function defaultTypography(localeValue: unknown): StorefrontTypography {
  const locale = normalizeTypographyLocale(localeValue)
  const display = locale === "si" ? "Noto Sans Sinhala" : locale === "ta" ? "Noto Sans Tamil" : "Inter"
  return {
    locale,
    revision: "local-default",
    heading: { source: "google", family: display, display_name: display, category: "sans-serif" },
    body: { source: "google", family: display, display_name: display, category: "sans-serif" },
    google_stylesheet_url: null,
    custom_faces: [],
  }
}

export function normalizeStorefrontTypography(value: unknown, localeValue: unknown): StorefrontTypography {
  const fallback = defaultTypography(localeValue)
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback
  const row = value as Record<string, unknown>
  const locale = normalizeTypographyLocale(row.locale ?? localeValue)
  const heading = parseResolvedFont(row.heading)
  const body = parseResolvedFont(row.body)
  if (!heading || !body) return defaultTypography(locale)
  const customFaces = Array.isArray(row.custom_faces) ? row.custom_faces.flatMap(parseFace).slice(0, 24) : []
  const requiredCustom = [heading, body].filter((font) => font.source === "custom")
  if (requiredCustom.some((font) => !customFaces.some((face) => face.family === font.family))) return defaultTypography(locale)
  return {
    locale,
    revision: typeof row.revision === "string" ? row.revision.slice(0, 100) : "unknown",
    heading,
    body,
    google_stylesheet_url: safeGoogleStylesheet(row.google_stylesheet_url),
    custom_faces: customFaces,
  }
}

export function typographyCssVariables(typography: StorefrontTypography) {
  const local = LOCAL_DEFAULTS[typography.locale]
  return {
    "--font-body": fontStack(typography.body.family, local),
    "--font-heading": fontStack(typography.heading.family, local),
  } as Record<"--font-body" | "--font-heading", string>
}

export function customFontFaceCss(typography: StorefrontTypography) {
  return typography.custom_faces.flatMap((face) => {
    if (!SAFE_FAMILY.test(face.family) || !SAFE_ASSET.test(face.asset_id)) return []
    const min = clampWeight(face.weight_min)
    const max = clampWeight(face.weight_max)
    const weight = min === max ? String(min) : `${Math.min(min, max)} ${Math.max(min, max)}`
    return `@font-face{font-family:"${face.family}";src:url("/api/cba/typography/fonts/${face.asset_id}") format("${face.format === "otf" ? "opentype" : face.format === "ttf" ? "truetype" : "woff2"}");font-style:${face.style === "italic" ? "italic" : "normal"};font-weight:${weight};font-display:swap;}`
  }).join("")
}

export function safeGoogleStylesheet(value: unknown) {
  if (typeof value !== "string" || value.length > 2000) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname === "fonts.googleapis.com" && url.pathname === "/css2" && url.searchParams.has("family")
      ? url.toString() : null
  } catch { return null }
}

function parseResolvedFont(value: unknown): ResolvedFont | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  const source = row.source === "custom" ? "custom" : row.source === "google" ? "google" : null
  const family = typeof row.family === "string" && SAFE_FAMILY.test(row.family) ? row.family : ""
  if (!source || !family) return null
  const familyId = typeof row.family_id === "string" && /^cmsfont_[A-Za-z0-9]+$/.test(row.family_id) ? row.family_id : undefined
  if (source === "custom" && !familyId) return null
  return {
    source,
    family,
    family_id: familyId,
    display_name: typeof row.display_name === "string" ? row.display_name.slice(0, 120) : family,
    category: typeof row.category === "string" ? row.category.slice(0, 30) : "sans-serif",
  }
}

function parseFace(value: unknown): TypographyFace[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return []
  const row = value as Record<string, unknown>
  if (typeof row.family !== "string" || !SAFE_FAMILY.test(row.family) || typeof row.asset_id !== "string" || !SAFE_ASSET.test(row.asset_id)) return []
  const min = Number(row.weight_min)
  const max = Number(row.weight_max)
  if (!Number.isFinite(min) || !Number.isFinite(max)) return []
  return [{ family: row.family, asset_id: row.asset_id, format: row.format === "otf" ? "otf" : row.format === "ttf" ? "ttf" : "woff2", style: row.style === "italic" ? "italic" : "normal", weight_min: clampWeight(min), weight_max: clampWeight(max) }]
}

function fontStack(selected: string, local: string) {
  const safeSelected = SAFE_FAMILY.test(selected) ? selected : local
  return `"${safeSelected}", "${local}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
}
function clampWeight(value: number) { return Math.max(100, Math.min(900, Math.round(value))) }
