import { retrieveOrder } from "@lib/data/orders"
import { establishGuestSessionFromConfirmation } from "@lib/data/order-tracking"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}
export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  // Ensure guests have a tracking session for receipt download (idempotent).
  await establishGuestSessionFromConfirmation(order.id)

  return <OrderCompletedTemplate order={order} />
}
