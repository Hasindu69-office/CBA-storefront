import { NextRequest, NextResponse } from "next/server"
import { ensurePopupGuestSession, forwardedSetCookie, guestCookiePair, popupBackend } from "../_proxy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const session = await ensurePopupGuestSession()
    const setCookie = forwardedSetCookie(session)
    const response = await popupBackend("/store/cba/v1/popups/eligible", { method: "POST", body: JSON.stringify(body), headers: guestCookiePair(setCookie) ? { cookie: guestCookiePair(setCookie)! } : {} })
    const payload = await response.json().catch(() => ({ campaign: null, server_time: new Date().toISOString() }))
    const next = NextResponse.json(payload, { status: response.ok ? 200 : response.status, headers: { "cache-control": "private, no-store" } })
    if (setCookie) next.headers.append("set-cookie", setCookie)
    return next
  } catch { return NextResponse.json({ campaign: null, server_time: new Date().toISOString() }, { headers: { "cache-control": "private, no-store" } }) }
}
