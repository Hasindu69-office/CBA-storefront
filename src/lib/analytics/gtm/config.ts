/** Client GTM container ID from Google Tag Manager (public by design). */
export const GTM_ID_FALLBACK = "GTM-WPLSJRPK"

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/

/**
 * Resolves the GTM container ID from env, falling back to the client-provided ID.
 * Invalid values are ignored so a bad deploy cannot inject a malformed loader URL.
 */
export function getGtmId(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GTM_ID?.trim()
  if (fromEnv && isValidGtmId(fromEnv)) {
    return fromEnv
  }
  return GTM_ID_FALLBACK
}

export function isValidGtmId(value: string | null | undefined): boolean {
  return Boolean(value && GTM_ID_PATTERN.test(value.trim()))
}
