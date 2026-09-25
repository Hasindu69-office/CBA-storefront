import { NextRequest, NextResponse } from "next/server"
import { popupBackend } from "../../_proxy"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!/^cbapop_[A-Za-z0-9_-]+$/.test(id)) return NextResponse.json({ success: false }, { status: 400 })
  try { const response = await popupBackend(`/store/cba/v1/popups/${encodeURIComponent(id)}/events`, { method: "POST", body: JSON.stringify(await request.json()) }); return NextResponse.json(await response.json().catch(() => ({ success: false })), { status: response.status, headers: { "cache-control": "private, no-store" } }) } catch { return NextResponse.json({ success: false }, { status: 202 }) }
}
