import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { retrieveOrderTrackingForRequest } from "@lib/data/order-tracking"
import ReturnIntakeRequestTemplate from "@modules/return-intake/templates/return-intake-request-template"

type Props = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Request return or support",
}

export default async function OrderReturnRequestPage(props: Props) {
  const params = await props.params
  const result = await retrieveOrderTrackingForRequest(params.id)

  if (!result?.tracking) {
    notFound()
  }

  if (!result.returnEligibility?.available) {
    redirect(`/account/orders/details/${params.id}`)
  }

  return (
    <ReturnIntakeRequestTemplate
      tracking={result.tracking}
      returnEligibility={result.returnEligibility}
    />
  )
}
