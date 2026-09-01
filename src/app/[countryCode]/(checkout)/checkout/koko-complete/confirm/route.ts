import {
  removeCartId,
  setOrderConfirmationAccess,
} from "@lib/data/cookies"
import { establishGuestSessionFromConfirmation } from "@lib/data/order-tracking"
import { localizedPath } from "@lib/util/routes"
import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"

type Props = {
  params: Promise<{ countryCode: string }>
}

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: Props) {
  const { countryCode } = await params
  const orderId = String(req.nextUrl.searchParams.get("order_id") ?? "").trim()
  const token = String(req.nextUrl.searchParams.get("token") ?? "").trim()

  if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^[a-f0-9]{64}$/i.test(token)) {
    return redirectToPaymentResult(req, countryCode, "KOKO_CALLBACK_INVALID")
  }

  const expected = signOrderId(orderId)
  if (!timingSafeEqualHex(token, expected)) {
    return redirectToPaymentResult(req, countryCode, "KOKO_SIGNATURE_INVALID")
  }

  await setOrderConfirmationAccess(orderId)
  await establishGuestSessionFromConfirmation(orderId)
  await removeCartId()

  return NextResponse.redirect(
    storefrontUrl(req, localizedPath(`/${countryCode}/order/${orderId}/confirmed`)),
    303
  )
}

function redirectToPaymentResult(req: NextRequest, countryCode: string, code: string) {
  return NextResponse.redirect(
    storefrontUrl(
      req,
      localizedPath(`/${countryCode}/checkout/payment-result?status=failed&code=${code}`)
    ),
    303
  )
}

function storefrontUrl(req: NextRequest, path: string) {
  return new URL(path, storefrontOrigin(req))
}

function storefrontOrigin(req: NextRequest) {
  const configured =
    process.env.NEXT_PUBLIC_STOREFRONT_URL || process.env.NEXT_PUBLIC_BASE_URL
  if (configured?.trim()) return configured.trim().replace(/\/+$/, "")

  const forwardedHost = req.headers.get("x-forwarded-host")
  const host = forwardedHost || req.headers.get("host")
  if (host && !isInternalBindHost(host)) {
    const proto =
      req.headers.get("x-forwarded-proto") ||
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
    return `${proto}://${host}`
  }
  return "http://localhost:8000"
}

function isInternalBindHost(host: string) {
  const hostname = host.split(":")[0]
  return hostname === "0.0.0.0" || hostname === "::" || hostname === "[::]"
}

function signOrderId(orderId: string) {
  const secret =
    process.env.CBA_STOREFRONT_CONFIRMATION_SECRET ??
    process.env.JWT_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "development-confirmation-secret"
  return crypto.createHmac("sha256", secret).update(orderId).digest("hex")
}

function timingSafeEqualHex(left: string, right: string) {
  try {
    const a = Uint8Array.from(Buffer.from(left, "utf8"))
    const b = Uint8Array.from(Buffer.from(right, "utf8"))
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
