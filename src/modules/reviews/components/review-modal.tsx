"use client"

import { submitReview, type EligibleReviewPurchase, type ReviewSubmissionState } from "@lib/data/reviews"
import { notify } from "@lib/notifications"
import { validateReviewInput, type ReviewFieldErrors } from "@lib/util/review-validation"
import { useActionState, useEffect, useRef, useState } from "react"

const initialState: ReviewSubmissionState = { success: false, message: "" }

export default function ReviewModal({ purchase, open, onClose, onSubmitted }: {
  purchase: EligibleReviewPurchase
  open: boolean
  onClose: () => void
  onSubmitted?: (state: ReviewSubmissionState) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [state, action, pending] = useActionState(submitReview, initialState)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [errors, setErrors] = useState<ReviewFieldErrors>({})
  const [idempotencyKey, setIdempotencyKey] = useState("")

  useEffect(() => {
    if (open && !dialogRef.current?.open) {
      setIdempotencyKey((value) => value || crypto.randomUUID())
      dialogRef.current?.showModal()
    } else if (!open && dialogRef.current?.open) dialogRef.current.close()
  }, [open])

  useEffect(() => {
    if (!state.message) return
    if (state.success) {
      notify.success(state.message, { id: "review-submit" })
      setRating(0); setTitle(""); setContent(""); setErrors({}); setIdempotencyKey("")
      onSubmitted?.(state)
      onClose()
    } else {
      setErrors(state.fieldErrors ?? {})
      notify.error(state.message, "Could not submit review.", { id: "review-submit" })
    }
    // Submission state is the event; callbacks may be recreated by their parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const result = validateReviewInput({ rating, title, content })
    setErrors(result.errors)
    if (!result.valid) event.preventDefault()
  }

  return (
    <dialog ref={dialogRef} onCancel={(event) => { if (pending) event.preventDefault(); else onClose() }}
      onClose={() => open && onClose()}
      className="w-[min(620px,calc(100%-32px))] rounded-xl p-0 shadow-2xl backdrop:bg-black/50">
      <form action={action} onSubmit={validate} className="p-6 small:p-8" noValidate>
        <input type="hidden" name="product_id" value={purchase.product_id} />
        <input type="hidden" name="order_id" value={purchase.order_id} />
        <input type="hidden" name="order_line_item_id" value={purchase.order_line_item_id} />
        <input type="hidden" name="idempotency_key" value={idempotencyKey} />
        <input type="hidden" name="rating" value={rating} />
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-xl font-bold text-gray-950">Review {purchase.product_title}</h2>
            <p className="mt-1 text-sm text-gray-600">Share your experience with other customers.</p></div>
          <button type="button" disabled={pending} onClick={onClose} aria-label="Close review form" className="rounded p-2 text-xl hover:bg-gray-100">×</button>
        </div>
        <fieldset className="mt-6" aria-describedby={errors.rating ? "review-rating-error" : undefined}>
          <legend className="text-sm font-semibold">Rating</legend>
          <div className="mt-2 flex gap-1" role="radiogroup">
            {[1,2,3,4,5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value}
              aria-label={`${value} star${value === 1 ? "" : "s"}`} onClick={() => { setRating(value); setErrors((e) => ({...e, rating: undefined})) }}
              className={`text-3xl ${value <= rating ? "text-[#ff5c0e]" : "text-gray-300"}`}>★</button>)}
          </div>
          {errors.rating && <p id="review-rating-error" className="mt-1 text-sm text-red-600">{errors.rating}</p>}
        </fieldset>
        <label className="mt-5 block text-sm font-semibold" htmlFor="review-title">Title <span className="font-normal text-gray-500">(optional)</span></label>
        <input id="review-title" name="title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(errors.title)} className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#ff5c0e] focus:outline-none" />
        <div className="mt-1 flex justify-between text-xs"><span className="text-red-600">{errors.title}</span><span className="text-gray-500">{title.length}/120</span></div>
        <label className="mt-5 block text-sm font-semibold" htmlFor="review-content">Review</label>
        <textarea id="review-content" name="content" value={content} minLength={10} maxLength={3000} rows={7}
          onChange={(e) => setContent(e.target.value)} aria-invalid={Boolean(errors.content)}
          className="mt-2 w-full resize-y rounded-md border border-gray-300 px-3 py-2 focus:border-[#ff5c0e] focus:outline-none" />
        <div className="mt-1 flex justify-between text-xs"><span className="text-red-600">{errors.content}</span><span className="text-gray-500">{content.length}/3000</span></div>
        <div className="mt-7 flex justify-end gap-3">
          <button type="button" disabled={pending} onClick={onClose} className="rounded-md border px-5 py-2.5 font-semibold">Cancel</button>
          <button type="submit" disabled={pending || !idempotencyKey} className="rounded-md bg-[#ff5c0e] px-5 py-2.5 font-semibold text-white disabled:opacity-50">
            {pending ? "Submitting…" : "Submit review"}
          </button>
        </div>
      </form>
    </dialog>
  )
}
