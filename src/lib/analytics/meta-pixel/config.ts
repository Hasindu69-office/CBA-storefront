/** Client pixel ID from Meta Events Manager (public by design). */
export const META_PIXEL_ID_FALLBACK = "1361822756100417"

const PIXEL_ID_PATTERN = /^\d{5,20}$/

/**
 * Resolves the Meta Pixel ID from env, falling back to the client-provided ID.
 * Invalid values are ignored so a bad deploy cannot break tracking entirely.
 */
export function getMetaPixelId(): string {
  const fromEnv = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  if (fromEnv && PIXEL_ID_PATTERN.test(fromEnv)) {
    return fromEnv
  }
  return META_PIXEL_ID_FALLBACK
}

export function isValidMetaPixelId(value: string | null | undefined): boolean {
  return Boolean(value && PIXEL_ID_PATTERN.test(value.trim()))
}
