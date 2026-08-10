"use client"

import { OrderTrackingErrorState } from "@modules/order-tracking/components/order-tracking-states"

export default function TrackOrderError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="bg-white py-10 small:py-14">
      <div className="content-container">
        <OrderTrackingErrorState
          title="Tracking temporarily unavailable"
          message="Please try again in a moment."
          action={
            <button
              type="button"
              onClick={reset}
              className="rounded-md bg-[#ff5c0e] px-4 py-2.5 text-[14px] font-semibold text-white"
            >
              Try again
            </button>
          }
        />
      </div>
    </main>
  )
}
