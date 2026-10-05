import type { PopupDevice, StorefrontPopup } from "@lib/data/popups"

export const POPUP_PROTECTED_PATHS = ["/checkout", "/order", "/account", "/cart", "/track-order", "/newsletter/confirm", "/newsletter/unsubscribe"] as const
export function normalizePopupPath(pathname: string) { const parts = pathname.split(/[?#]/, 1)[0].replace(/\\/g, "/").replace(/\/{2,}/g, "/").split("/").filter(Boolean); if (parts[0] && /^[a-z]{2}$/i.test(parts[0])) parts.shift(); return `/${parts.join("/")}`.replace(/\/$/, "") || "/" }
export function isPopupProtectedPath(pathname: string) { const path = normalizePopupPath(pathname); return POPUP_PROTECTED_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) }
export function popupDevice(width: number): PopupDevice { return width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop" }
export function triggerSatisfied(trigger: StorefrontPopup["trigger"], state: { delay: boolean; scroll: boolean; exit: boolean }) { const configured: boolean[] = []; if (trigger.delay_seconds !== undefined) configured.push(state.delay); if (trigger.scroll_percentage !== undefined) configured.push(state.scroll); if (trigger.exit_intent) configured.push(state.exit); return configured.length > 0 && (trigger.strategy === "ALL" ? configured.every(Boolean) : configured.some(Boolean)) }

type LocalState = { last_impression_at?: number; dismissed_at?: number; clicked_at?: number; newsletter_submitted?: boolean }
const PREFIX = "cba.popup.v1."
export function readPopupState(id: string): LocalState { try { const raw = localStorage.getItem(`${PREFIX}${id}`); if (!raw) return {}; const value = JSON.parse(raw); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); return { last_impression_at: validNumber(value.last_impression_at), dismissed_at: validNumber(value.dismissed_at), clicked_at: validNumber(value.clicked_at), newsletter_submitted: value.newsletter_submitted === true } } catch { try { localStorage.removeItem(`${PREFIX}${id}`) } catch {}; return {} } }
export function writePopupState(id: string, patch: LocalState) { try { localStorage.setItem(`${PREFIX}${id}`, JSON.stringify({ ...readPopupState(id), ...patch })); prunePopupState() } catch {} }
export function isPopupLocallySuppressed(campaign: StorefrontPopup, state: LocalState, now = Date.now()) {
  const active = (timestamp: number | undefined, hours: number | undefined) => Boolean(timestamp && hours && now - timestamp < hours * 3600000)
  return Boolean((campaign.frequency.suppress_after_newsletter_submit && state.newsletter_submitted) || active(state.last_impression_at, campaign.frequency.impression_cooldown_hours) || active(state.dismissed_at, campaign.frequency.dismiss_cooldown_hours) || active(state.clicked_at, campaign.frequency.click_cooldown_hours))
}
function validNumber(value: unknown) { return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined }
function prunePopupState() { try { const entries: Array<{ key: string; time: number }> = []; for (let i=0; i<localStorage.length; i++) { const key=localStorage.key(i); if (key?.startsWith(PREFIX)) { const state=readPopupState(key.slice(PREFIX.length)); entries.push({ key, time: Math.max(state.last_impression_at ?? 0, state.dismissed_at ?? 0, state.clicked_at ?? 0) }) } } entries.sort((a,b)=>b.time-a.time).slice(50).forEach((entry)=>localStorage.removeItem(entry.key)) } catch {} }
