"use client"

import type { CustomerReview, EligibleReviewPurchase } from "@lib/data/reviews"
import { useState } from "react"
import ReviewModal from "./review-modal"

export default function OrderReviewActions({ purchases, reviews }: { purchases: EligibleReviewPurchase[]; reviews: CustomerReview[] }) {
  const [selected, setSelected] = useState<EligibleReviewPurchase | null>(null)
  const [submitted, setSubmitted] = useState(reviews)
  if (!purchases.length && !submitted.length) return null
  return <section className="rounded-lg border bg-white p-5 small:p-6">
    <h2 className="text-lg font-bold">Product reviews</h2><p className="mt-1 text-sm text-gray-600">Share feedback about delivered items from this order.</p>
    <div className="mt-5 divide-y">{submitted.map((review)=><div key={review.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold">{review.product?.title ?? "Product"}</p><p className="text-sm text-gray-600">Your {review.rating}-star review</p></div></div>)}
      {purchases.filter((purchase)=>!submitted.some((review)=>review.product_id===purchase.product_id)).map((purchase)=><div key={purchase.product_id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold">{purchase.product_title}</p><p className="text-sm text-gray-600">Delivered purchase</p></div><button onClick={()=>setSelected(purchase)} className="rounded-md border border-[#ff5c0e] px-4 py-2 font-semibold text-[#ff5c0e]">Write a review</button></div>)}
    </div>
    {selected && <ReviewModal purchase={selected} open onClose={()=>setSelected(null)} onSubmitted={(state)=>state.review && setSubmitted((current)=>[state.review!,...current])} />}
  </section>
}
