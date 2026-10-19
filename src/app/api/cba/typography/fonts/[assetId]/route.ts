import { createHash } from "crypto"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
const MAX_FONT_BYTES = 4 * 1024 * 1024
const BACKEND = (process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "")

export async function GET(_request: Request, context: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await context.params
  if (!/^[a-f0-9]{32}$/.test(assetId)) return NextResponse.json({ error: "Font file was not found." }, { status: 404 })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(`${BACKEND}/store/cba/v1/typography/fonts/${assetId}`, {
      headers: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ? { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY } : undefined,
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    })
    const declared = Number(response.headers.get("content-length") || 0)
    if (!response.ok || (declared && declared > MAX_FONT_BYTES)) return NextResponse.json({ error: "Font file was not found." }, { status: 404 })
    const bytes = await readBounded(response, MAX_FONT_BYTES)
    const format = detectFontFormat(bytes, response.headers.get("content-type"))
    if (!format) {
      return NextResponse.json({ error: "Font file was not found." }, { status: 404 })
    }
    const etag = `"${createHash("sha256").update(bytes).digest("hex")}"`
    const body = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(body).set(bytes)
    return new NextResponse(body, { headers: {
      "Content-Type": format === "otf" ? "font/otf" : format === "ttf" ? "font/ttf" : "font/woff2",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ETag: etag,
    } })
  } catch {
    return NextResponse.json({ error: "Font file was not found." }, { status: 404 })
  } finally { clearTimeout(timer) }
}

function detectFontFormat(bytes: Uint8Array, contentType: string | null): "woff2" | "otf" | "ttf" | null {
  if (bytes.byteLength < 4) return null
  if (bytes[0] === 0x77 && bytes[1] === 0x4f && bytes[2] === 0x46 && bytes[3] === 0x32) return "woff2"
  if (bytes[0] === 0x4f && bytes[1] === 0x54 && bytes[2] === 0x54 && bytes[3] === 0x4f) return "otf"
  const trueType = (bytes[0] === 0x00 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00)
    || (bytes[0] === 0x74 && bytes[1] === 0x72 && bytes[2] === 0x75 && bytes[3] === 0x65)
  if (trueType) return String(contentType || "").toLowerCase().includes("otf") ? "otf" : "ttf"
  return null
}

async function readBounded(response: Response, maximum: number) {
  if (!response.body) throw new Error("Missing font body")
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maximum) throw new Error("Font response is too large")
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const result = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength }
  return result
}
