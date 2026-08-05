import { retrieveCart } from "@lib/data/cart"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import WebxpayRedirectClient from "@modules/checkout/components/webxpay-redirect-client"
import { getStoreCountryCode, localizedPath } from "@lib/util/routes"
import { isWebxpay } from "@lib/constants"

export const metadata: Metadata = {
  title: "Continuing to WEBXPAY",
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = "force-dynamic"

export default async function WebxpayRedirectPage() {
  const cart = await retrieveCart()
  const countryCode = getStoreCountryCode(
    cart?.shipping_address?.country_code
  )

  if (!cart) {
    console.warn("[webxpay] redirect page: cart missing")
    return notFound()
  }

  const session = cart.payment_collection?.payment_sessions?.find(
    (item) => item.status === "pending"
  )

  if (process.env.NODE_ENV !== "production") {
    console.info("[webxpay] redirect page loaded", {
      cart_id: cart.id,
      provider_id: session?.provider_id ?? null,
    })
  }

  if (!isWebxpay(session?.provider_id)) {
    console.warn("[webxpay] redirect page: active session is not WEBXPAY; returning to checkout", {
      cart_id: cart.id,
      provider_id: session?.provider_id ?? null,
    })
    redirect(
      `${localizedPath(`/${countryCode}/checkout`)}?webxpay_error=select_webxpay`
    )
  }

  return (
    <div className="content-container flex min-h-[60vh] items-center justify-center py-12">
      <WebxpayRedirectClient countryCode={countryCode} cartId={cart.id} />
    </div>
  )
}
