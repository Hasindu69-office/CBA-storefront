import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CbaCheckoutTemplate from "@modules/checkout/templates/cba-checkout-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()
  const [shippingMethods, paymentMethods] = await Promise.all([
    listCartShippingMethods(cart.id),
    listCartPaymentMethods(cart.region?.id ?? ""),
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
      />
    </PaymentWrapper>
  )
}
