import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { retrieveWebxpayCheckoutBranding } from "@lib/data/webxpay-branding"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CbaCheckoutTemplate from "@modules/checkout/templates/cba-checkout-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export const dynamic = "force-dynamic"

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()
  const [shippingMethods, paymentMethods, webxpayBranding] = await Promise.all([
    listCartShippingMethods(cart.id),
    listCartPaymentMethods(cart.region?.id ?? ""),
    retrieveWebxpayCheckoutBranding(),
  ])

  if (!shippingMethods || !paymentMethods) {
    return notFound()
  }

  return (
    <PaymentWrapper cart={cart}>
      <CbaCheckoutTemplate
        cart={cart}
        customer={customer}
        shippingMethods={shippingMethods}
        paymentMethods={paymentMethods}
        webxpayBranding={webxpayBranding}
      />
    </PaymentWrapper>
  )
}
