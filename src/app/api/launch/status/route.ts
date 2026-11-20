import { NextResponse } from "next/server"

import { getLaunchStatusPayload } from "@lib/launch/status"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getLaunchStatusPayload()
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to read launch status.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}
