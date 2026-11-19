import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

import { resolvePublicCacheTags } from "@lib/data/public-cache"

export const dynamic = "force-dynamic"

type RevalidateBody = {
  tags?: string[]
  scopes?: string[]
}

function readSecret(request: NextRequest, body: RevalidateBody) {
  const headerSecret =
    request.headers.get("x-revalidate-secret")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    ""
  if (headerSecret) {
    return headerSecret
  }

  const querySecret = request.nextUrl.searchParams.get("secret")?.trim()
  if (querySecret) {
    return querySecret
  }

  return typeof (body as { secret?: unknown }).secret === "string"
    ? String((body as { secret?: string }).secret).trim()
    : ""
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET?.trim()
  if (!expected) {
    return NextResponse.json(
      { success: false, error: "REVALIDATE_SECRET is not configured." },
      { status: 503 }
    )
  }

  let body: RevalidateBody = {}
  try {
    body = (await request.json()) as RevalidateBody
  } catch {
    body = {}
  }

  const provided = readSecret(request, body)
  if (!provided || provided !== expected) {
    return NextResponse.json(
      { success: false, error: "Invalid revalidate secret." },
      { status: 401 }
    )
  }

  const tags = resolvePublicCacheTags({
    tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
    scopes: Array.isArray(body.scopes) ? body.scopes.map(String) : undefined,
  })

  for (const tag of tags) {
    revalidateTag(tag)
  }

  return NextResponse.json({
    success: true,
    revalidated: true,
    tags,
    now: Date.now(),
  })
}
