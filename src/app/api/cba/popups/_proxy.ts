import "server-only"
import { cookies } from "next/headers"

const BACKEND = (process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "")
const GUEST_COOKIE = "cba_guest_engagement"

export async function popupBackend(path: string, init: RequestInit = {}) {
  const store = await cookies()
  const auth = store.get(process.env.AUTH_COOKIE_NAME || "_CBA_Ebiz")?.value || store.get("_medusa_jwt")?.value
  const guest = store.get(GUEST_COOKIE)?.value
  return fetch(`${BACKEND}${path}`, { ...init, headers: { "content-type": "application/json", ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ? { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY } : {}), ...(auth ? { authorization: `Bearer ${auth}` } : {}), ...(guest ? { cookie: `${GUEST_COOKIE}=${encodeURIComponent(guest)}` } : {}), ...(init.headers ?? {}) }, cache: "no-store" })
}

export async function ensurePopupGuestSession() {
  const store = await cookies()
  if (store.get(GUEST_COOKIE)?.value || store.get(process.env.AUTH_COOKIE_NAME || "_CBA_Ebiz")?.value || store.get("_medusa_jwt")?.value) return null
  return popupBackend("/store/cba/v1/engagement/session", { method: "POST", body: "{}" })
}
export function forwardedSetCookie(response: Response | null) { return response?.headers.get("set-cookie") ?? null }
export function guestCookiePair(setCookie: string | null) { return setCookie?.split(";", 1)[0] ?? null }
export { BACKEND, GUEST_COOKIE }
