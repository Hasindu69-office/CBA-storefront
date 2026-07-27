import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import { headers } from "next/headers"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const pathname = requestHeaders.get("x-cba-pathname") ?? ""
  const customer = await retrieveCustomer()
  const isAccountAuthRoute =
    pathname === "/account" || pathname.startsWith("/account/oauth/")

  if (isAccountAuthRoute && !customer) {
    return <>{props.children}</>
  }

  const cart = await retrieveCart()
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()

    shippingOptions = shipping_options
  }

  return (
    <>
      <div className="cba-site-chrome">
        <Nav />
      </div>
      {customer && cart && (
        <div className="cba-site-chrome">
          <CartMismatchBanner customer={customer} cart={cart} />
        </div>
      )}

      {cart && (
        <div className="cba-site-chrome">
          <FreeShippingPriceNudge
            variant="popup"
            cart={cart}
            shippingOptions={shippingOptions}
          />
        </div>
      )}
      {props.children}
      <div className="cba-site-chrome">
        <Footer />
      </div>
    </>
  )
}
