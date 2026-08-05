import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveAccountOrderTracking } from "@lib/data/order-tracking"
import AccountOrderTrackingTemplate from "@modules/order-tracking/templates/account-order-tracking-template"
import { formatOrderNumber } from "@modules/order-tracking/utils/format-tracking"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const tracking = await retrieveAccountOrderTracking(params.id)

  if (!tracking) {
    return { title: "Order" }
  }

  return {
    title: `Order ${formatOrderNumber(tracking.order.display_id)}`,
    description: "View order status and shipment tracking",
  }
}

export default async function OrderDetailPage(props: Props) {
  const params = await props.params
  const tracking = await retrieveAccountOrderTracking(params.id)

  if (!tracking) {
    notFound()
  }

  return <AccountOrderTrackingTemplate tracking={tracking} />
}
