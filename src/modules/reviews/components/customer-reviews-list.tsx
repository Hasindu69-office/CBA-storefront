"use client"

import { listCustomerReviews, type CustomerReview } from "@lib/data/reviews"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState, useTransition } from "react"

export default function CustomerReviewsList({ initialReviews, initialCount }: { initialReviews: CustomerReview[]; initialCount: number }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [count, setCount] = useState(initialCount)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  function loadMore() {
    setError("")
    startTransition(async () => {
      const result = await listCustomerReviews({ limit: 20, offset: reviews.length })
      if (!result.reviews) { setError("Your reviews could not be loaded."); return }
      setReviews((current) => Array.from(new Map([...current, ...result.reviews!].map((item)=>[item.id,item])).values()))
      setCount(result.count)
    })
  }
  if (!reviews.length) return <div className="rounded-lg border border-dashed p-8 text-center"><h2 className="font-bold">No reviews yet</h2><p className="mt-2 text-sm text-gray-600">After an order is delivered, you can review its products from the order details page.</p><LocalizedClientLink href="/account/orders" className="mt-5 inline-block font-semibold text-[#ff5c0e]">View orders</LocalizedClientLink></div>
  return <div>
    <div className="space-y-4">{reviews.map((review)=><article key={review.id} className="rounded-lg border bg-white p-5">
      <div><LocalizedClientLink href={review.product?.handle ? `/products/${review.product.handle}` : "/store"} className="font-bold hover:text-[#ff5c0e]">{review.product?.title ?? "Product"}</LocalizedClientLink><p className="mt-1 text-[#ff5c0e]" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</p></div>
      {review.title && <h3 className="mt-4 font-semibold">{review.title}</h3>}<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{review.content}</p>
      <p className="mt-3 text-xs text-gray-500">{review.created_at ? new Date(review.created_at).toLocaleDateString() : "Submitted"}</p>
    </article>)}</div>
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
    {reviews.length < count && <button disabled={pending} onClick={loadMore} className="mt-5 rounded-md border px-5 py-2.5 font-semibold disabled:opacity-50">{pending ? "Loading…" : "Load more"}</button>}
  </div>
}
