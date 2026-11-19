const PIXEL_ID_PATTERN = /^\d{5,20}$/

/**
 * Resolves the Meta Pixel ID from env.
 * Returns null when unset or invalid so the pixel stays fully off.
 */
export function getMetaPixelId(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  if (fromEnv && PIXEL_ID_PATTERN.test(fromEnv)) {
    return fromEnv
  }
  return null
}

export function isValidMetaPixelId(value: string | null | undefined): boolean {
  return Boolean(value && PIXEL_ID_PATTERN.test(value.trim()))
}

/** True only when a valid NEXT_PUBLIC_META_PIXEL_ID is configured. */
export function isMetaPixelEnabled(): boolean {
  return getMetaPixelId() !== null
}
