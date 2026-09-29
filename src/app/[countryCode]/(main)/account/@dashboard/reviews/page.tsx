import type { Metadata } from "next"
import { listCustomerReviews } from "@lib/data/reviews"
import CustomerReviewsList from "@modules/reviews/components/customer-reviews-list"

export const metadata: Metadata = { title: "My Reviews", description: "View your product review history" }

export default async function ReviewsPage() {
  const result = await listCustomerReviews({ limit: 20 })
  return <div className="flex flex-col gap-6">
    <header><h1 className="text-2xl font-bold text-gray-950">My Reviews</h1><p className="mt-2 text-sm text-gray-600">View the product reviews you have submitted.</p></header>
    <CustomerReviewsList initialReviews={result.reviews ?? []} initialCount={result.count} />
  </div>
}
