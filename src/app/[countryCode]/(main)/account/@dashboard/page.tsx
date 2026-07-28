import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"
import { retrieveAccountDashboard } from "@lib/data/account-dashboard"
import { listFeaturedProductCards } from "@lib/data/featured-products"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account activity.",
}

export default async function OverviewTemplate() {
  const [dashboard, recommendedProducts] = await Promise.all([
    retrieveAccountDashboard(5),
    listFeaturedProductCards(4).catch(() => []),
  ])

  if (!dashboard) {
    notFound()
  }

  return (
    <Overview
      dashboard={dashboard}
      recommendedProducts={recommendedProducts}
    />
  )
}
