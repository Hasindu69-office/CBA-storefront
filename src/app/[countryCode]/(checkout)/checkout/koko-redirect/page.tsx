import { retrieveCart } from "@lib/data/cart"
import { isKoko } from "@lib/constants"
import { getStoreCountryCode, localizedPath } from "@lib/util/routes"
import KokoRedirectClient from "@modules/checkout/components/koko-redirect-client"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Continuing to Koko",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function KokoRedirectPage() {
  const cart = await retrieveCart()
  const countryCode = getStoreCountryCode(cart?.shipping_address?.country_code)

  if (!cart) return notFound()

  const session = cart.payment_collection?.payment_sessions?.find(
    (item) => item.status === "pending"
  )

  if (!isKoko(session?.provider_id)) {
    redirect(`${localizedPath(`/${countryCode}/checkout`)}?koko_error=select_koko`)
  }

  return (
    <div className="content-container flex min-h-[60vh] items-center justify-center py-12">
      <KokoRedirectClient countryCode={countryCode} cartId={cart.id} />
    </div>
  )
}
