import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listOrderDocuments } from "@lib/data/order-documents"
import { retrieveAccountOrderTracking } from "@lib/data/order-tracking"
import AccountOrderTrackingTemplate from "@modules/order-tracking/templates/account-order-tracking-template"
import { formatOrderNumber } from "@modules/order-tracking/utils/format-tracking"
import { listCustomerReviews, listReviewEligibility } from "@lib/data/reviews"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const result = await retrieveAccountOrderTracking(params.id)

  if (!result?.tracking) {
    return { title: "Order" }
  }

  return {
    title: `Order ${formatOrderNumber(result.tracking.order.display_id)}`,
    description: "View order status and shipment tracking",
  }
}

export default async function OrderDetailPage(props: Props) {
  const params = await props.params
  const [result, documentsResult, eligibility, reviews] = await Promise.all([
    retrieveAccountOrderTracking(params.id),
    listOrderDocuments(params.id),
    listReviewEligibility({ limit: 100 }),
    listCustomerReviews({ limit: 100 }),
  ])

  if (!result?.tracking) {
    notFound()
  }

  return (
    <AccountOrderTrackingTemplate
      tracking={result.tracking}
      returnEligibility={result.returnEligibility}
      documents={documentsResult?.documents ?? []}
      reviewPurchases={(eligibility.purchases ?? []).filter((purchase) => purchase.order_id === params.id)}
      submittedReviews={(reviews.reviews ?? []).filter((review) => review.order_id === params.id)}
    />
  )
}
