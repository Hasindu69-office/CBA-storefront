import {
  removeCartId,
  setOrderConfirmationAccess,
} from "@lib/data/cookies"
import { establishGuestSessionFromConfirmation } from "@lib/data/order-tracking"
import { getStoreCountryCode, localizedPath } from "@lib/util/routes"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import crypto from "crypto"

export const metadata: Metadata = {
  title: "Confirming payment",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

type Props = {
  searchParams: Promise<{ order_id?: string; token?: string }>
}

export default async function WebxpayCompletePage({ searchParams }: Props) {
  const query = await searchParams
  const orderId = String(query.order_id ?? "").trim()
  const token = String(query.token ?? "").trim()
  const countryCode = await getStoreCountryCode()

  if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^[a-f0-9]{64}$/i.test(token)) {
    redirect(
      localizedPath(
        `/${countryCode}/checkout/payment-result?status=failed&code=WEBXPAY_CALLBACK_INVALID`
      )
    )
  }

  const expected = signOrderId(orderId)
  if (!timingSafeEqualHex(token, expected)) {
    redirect(
      localizedPath(
        `/${countryCode}/checkout/payment-result?status=failed&code=WEBXPAY_SIGNATURE_INVALID`
      )
    )
  }

  await setOrderConfirmationAccess(orderId)
  await establishGuestSessionFromConfirmation(orderId)
  await removeCartId()
  redirect(localizedPath(`/${countryCode}/order/${orderId}/confirmed`))
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
