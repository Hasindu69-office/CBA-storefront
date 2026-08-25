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
    return redirectToPaymentResult(req, countryCode, "WEBXPAY_CALLBACK_INVALID")
  }

  const expected = signOrderId(orderId)
  if (!timingSafeEqualHex(token, expected)) {
    return redirectToPaymentResult(req, countryCode, "WEBXPAY_SIGNATURE_INVALID")
  }

  await setOrderConfirmationAccess(orderId)
  await establishGuestSessionFromConfirmation(orderId)
  await removeCartId()

  return NextResponse.redirect(
    new URL(localizedPath(`/${countryCode}/order/${orderId}/confirmed`), req.url),
    303
  )
}

function redirectToPaymentResult(req: NextRequest, countryCode: string, code: string) {
  return NextResponse.redirect(
    new URL(
      localizedPath(`/${countryCode}/checkout/payment-result?status=failed&code=${code}`),
      req.url
    ),
    303
  )
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
