import { NextRequest, NextResponse } from "next/server"

import {
  isLaunchGateEnabled,
  isLaunchResetAllowed,
} from "@lib/launch/config"
import { postBackendLaunchAction } from "@lib/launch/status"

export const dynamic = "force-dynamic"

function readSecret(request: NextRequest, body: { secret?: unknown }) {
  const header =
    request.headers.get("x-launch-secret")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    ""
  if (header) {
    return header
  }
  return typeof body.secret === "string" ? body.secret.trim() : ""
}

export async function POST(request: NextRequest) {
  if (!isLaunchGateEnabled()) {
    return NextResponse.json(
      { success: false, error: "Launch gate is disabled." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    )
  }

  if (!isLaunchResetAllowed()) {
    return NextResponse.json(
      { success: false, error: "Launch reset is disabled." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    )
  }

  let body: { secret?: unknown } = {}
  try {
    body = (await request.json()) as { secret?: unknown }
  } catch {
    body = {}
  }

  try {
    const data = await postBackendLaunchAction("reset", readSecret(request, body))
    return NextResponse.json(
      { success: true, data: { ...data, gate_enabled: true } },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    const status =
      typeof error === "object" &&
      error &&
      "status" in error &&
      typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 500
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to reset launch.",
      },
      { status, headers: { "Cache-Control": "no-store" } }
    )
  }
}
