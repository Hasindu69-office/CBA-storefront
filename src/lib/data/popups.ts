export type PopupDevice = "desktop" | "tablet" | "mobile"
export type StorefrontPopup = {
  id: string
  campaign_key: string
  presentation_type: "modal" | "slide_in"
  content: { layout_variant?: "classic" | "editorial_hero"; text_tone?: "dark" | "light"; desktop_image_position?: "left" | "center" | "right"; overlay_strength?: "none" | "soft" | "strong"; eyebrow?: string; title: string; description?: string; desktop_image_url?: string; mobile_image_url?: string; image_alt?: string; primary_cta_label?: string; secondary_cta_label?: string; mobile_presentation?: "modal" | "bottom_sheet"; consent_text?: string }
  action: { type: "none" | "internal_url" | "external_url" | "product" | "category" | "collection" | "promotion" | "newsletter"; url?: string; open_in_new_tab?: boolean }
  trigger: { strategy: "ANY" | "ALL"; delay_seconds?: number; scroll_percentage?: number; exit_intent?: boolean }
  frequency: { once_per_session: boolean; impression_cooldown_hours?: number; dismiss_cooldown_hours?: number; click_cooldown_hours?: number; suppress_after_newsletter_submit?: boolean }
  event_token: string
}
export type PopupEventType = "impression" | "dismiss" | "cta_click" | "newsletter_submit_success"

export async function fetchEligiblePopup(input: { pathname: string; country_code: string; device: PopupDevice; excluded_campaign_ids?: string[] }, signal?: AbortSignal) {
  const response = await fetch("/api/cba/popups/eligible", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...input, excluded_campaign_ids: input.excluded_campaign_ids ?? [] }), credentials: "same-origin", cache: "no-store", signal })
  if (!response.ok) return null
  const payload = await response.json().catch(() => null) as { campaign?: StorefrontPopup | null } | null
  return payload?.campaign ?? null
}
export async function reportPopupEvent(campaign: StorefrontPopup, type: PopupEventType) {
  const eventId = crypto.randomUUID()
  const request = { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event_id: eventId, type, event_token: campaign.event_token }), credentials: "same-origin" as const, keepalive: true, cache: "no-store" as const }
  for (let attempt=0; attempt<2; attempt++) {
    try { const response=await fetch(`/api/cba/popups/${encodeURIComponent(campaign.id)}/events`,request); if(response.ok||response.status<500)return } catch { if(attempt===1)return }
  }
}
export async function subscribeFromPopup(campaign: StorefrontPopup, email: string, recaptchaToken: string) {
  const response = await fetch("/api/cba/popups/newsletter", { method: "POST", headers: { "content-type": "application/json", ...(recaptchaToken ? { "x-cba-recaptcha-token": recaptchaToken } : {}) }, body: JSON.stringify({ email, source_campaign_id: campaign.id, popup_event_id: crypto.randomUUID(), popup_event_token: campaign.event_token }), credentials: "same-origin", cache: "no-store" })
  const payload = await response.json().catch(() => null) as { message?: string; error?: { message?: string } } | null
  if (!response.ok) throw new Error(payload?.error?.message ?? payload?.message ?? "We could not submit your subscription. Please try again.")
  return payload?.message ?? "If this address can receive newsletters, a confirmation email will be sent."
}
