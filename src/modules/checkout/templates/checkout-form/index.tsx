import { setShippingMethod } from "@lib/data/cart"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  const defaultShippingMethod =
    shippingMethods.find(
      (method) =>
        method.service_zone?.fulfillment_set?.type !== "pickup" &&
        !method.insufficient_inventory
    ) ??
    shippingMethods.find((method) => !method.insufficient_inventory)

  const shouldSetDefaultShippingMethod =
    cart.shipping_address && !cart.shipping_methods?.length && defaultShippingMethod

  if (shouldSetDefaultShippingMethod) {
    await setShippingMethod({
      cartId: cart.id,
      shippingMethodId: defaultShippingMethod.id,
    })
  }

  const checkoutCart = shouldSetDefaultShippingMethod
    ? {
        ...cart,
        shipping_methods: [
          {
            shipping_option_id: defaultShippingMethod.id,
            name: defaultShippingMethod.name,
            amount: defaultShippingMethod.amount ?? 0,
          },
        ],
      }
    : cart

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses cart={cart} customer={customer} />

      <Payment cart={checkoutCart} availablePaymentMethods={paymentMethods} />

      <Review cart={checkoutCart} />
    </div>
  )
}
