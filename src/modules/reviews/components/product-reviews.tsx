"use client"

import { getProductReviews, type ProductDetailResponse, type ProductReview, type ProductReviewsResponse } from "@lib/data/product-detail"
import { useRef, useState, useTransition } from "react"

type Sort = "recent" | "highest" | "lowest"

export default function ProductReviews({ productId, initial, yourReviewId }: { productId: string; initial: ProductReviewsResponse; yourReviewId?: string | null }) {
  const [reviews, setReviews] = useState<ProductReview[]>(initial.reviews)
  const [summary] = useState<NonNullable<ProductDetailResponse["review_summary"]>>(initial.summary)
  const [count, setCount] = useState(initial.count)
  const [sort, setSort] = useState<Sort>("recent")
  const [rating, setRating] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const requestId = useRef(0)

  function load(reset: boolean, next: { sort?: Sort; rating?: number; verifiedOnly?: boolean } = {}) {
    const selectedSort = next.sort ?? sort
    const selectedRating = next.rating ?? rating
    const selectedVerified = next.verifiedOnly ?? verifiedOnly
    const offset = reset ? 0 : reviews.length
    const id = ++requestId.current
    setError("")
    startTransition(async () => {
      try {
        const result = await getProductReviews(productId, {
          limit: 5, offset, sort: selectedSort,
          rating: selectedRating || undefined, verified_only: selectedVerified || undefined,
          strict: true,
        })
        if (id !== requestId.current) return
        setReviews((current) => reset ? result.reviews : dedupe([...current, ...result.reviews]))
        setCount(result.count)
      } catch {
        if (id === requestId.current) setError("Reviews could not be loaded. Please try again.")
      }
    })
  }

  const total = summary.total_reviews ?? 0
  return <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
    <aside>
      <p className="text-4xl font-black">{summary.average_rating ? summary.average_rating.toFixed(1) : "—"}</p>
      <p className="mt-1 text-sm text-gray-600">{total.toLocaleString()} customer reviews</p>
      <div className="mt-5 space-y-2">{[5,4,3,2,1].map((star) => {
        const value = summary.rating_counts?.[String(star)] ?? 0
        return <div key={star} className="grid grid-cols-[42px_1fr_30px] items-center gap-2 text-xs">
          <span>{star} star</span><div className="h-2 overflow-hidden rounded bg-gray-100"><div className="h-full bg-[#ff5c0e]" style={{width: `${total ? Math.round(value / total * 100) : 0}%`}} /></div><span>{value}</span>
        </div>
      })}</div>
    </aside>
    <section aria-busy={pending}>
      <div className="flex flex-wrap gap-3 border-b pb-4">
        <select aria-label="Sort reviews" value={sort} onChange={(e) => { const value=e.target.value as Sort; setSort(value); load(true,{sort:value}) }} className="rounded-md border px-3 py-2 text-sm">
          <option value="recent">Most recent</option><option value="highest">Highest rated</option><option value="lowest">Lowest rated</option>
        </select>
        <select aria-label="Filter by rating" value={rating} onChange={(e) => { const value=Number(e.target.value); setRating(value); load(true,{rating:value}) }} className="rounded-md border px-3 py-2 text-sm">
          <option value={0}>All ratings</option>{[5,4,3,2,1].map((value)=><option key={value} value={value}>{value} stars</option>)}
        </select>
        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><input type="checkbox" checked={verifiedOnly} onChange={(e)=>{setVerifiedOnly(e.target.checked);load(true,{verifiedOnly:e.target.checked})}} /> Verified purchases</label>
      </div>
      {error && <div role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error} <button onClick={()=>load(true)} className="font-bold underline">Retry</button></div>}
      <div className="divide-y">{reviews.map((review)=><article key={review.id} className="py-5">
        <div className="flex flex-wrap items-center gap-2"><Stars rating={review.rating}/><span className="font-bold">{review.rating.toFixed(1)}</span>{review.id === yourReviewId && <span className="rounded bg-orange-50 px-2 py-1 text-xs font-semibold text-[#d94e0b]">Your review</span>}{review.verified_purchase && <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Verified purchase</span>}</div>
        {review.title && <h3 className="mt-3 font-bold">{review.title}</h3>}<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{review.content}</p>
        <p className="mt-3 text-xs text-gray-500">{review.customer_display_name ?? "Customer"}{review.created_at ? ` · ${new Date(review.created_at).toLocaleDateString()}` : ""}</p>
      </article>)}</div>
      {!reviews.length && !pending && <p className="py-8 text-sm text-gray-600">No reviews match these filters.</p>}
      {reviews.length < count && <button disabled={pending} onClick={()=>load(false)} className="mt-5 rounded-md border px-5 py-2.5 font-semibold disabled:opacity-50">{pending ? "Loading…" : "Load more"}</button>}
    </section>
  </div>
}

function dedupe(items: ProductReview[]) { return Array.from(new Map(items.map((item)=>[item.id,item])).values()) }
function Stars({rating}:{rating:number}) { return <span className="text-[#ff5c0e]" aria-label={`${rating} out of 5 stars`}>{[1,2,3,4,5].map((i)=><span key={i}>{i <= Math.round(rating) ? "★" : "☆"}</span>)}</span> }
