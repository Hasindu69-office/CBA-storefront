import { NextRequest, NextResponse } from "next/server"
import { popupBackend } from "../_proxy"

export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    const response = await popupBackend("/store/cba/v1/newsletter/subscriptions", { method: "POST", headers: request.headers.get("x-cba-recaptcha-token") ? { "x-cba-recaptcha-token": request.headers.get("x-cba-recaptcha-token")! } : {}, body: JSON.stringify({ email: input.email, source: "popup", source_campaign_id: input.source_campaign_id, popup_event_id: input.popup_event_id, popup_event_token: input.popup_event_token, locale: "en", consent_version: "2026-07-cba-marketing-v1", marketing_consent: true }) })
    return NextResponse.json(await response.json().catch(() => ({ error: { message: "Subscription could not be completed." } })), { status: response.status, headers: { "cache-control": "private, no-store" } })
  } catch { return NextResponse.json({ error: { message: "Subscription could not be completed." } }, { status: 400 }) }
}
