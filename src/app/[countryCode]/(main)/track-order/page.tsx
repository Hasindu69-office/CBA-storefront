import { Metadata } from "next"

import { retrieveGuestTrackingSession } from "@lib/data/order-tracking"
import GuestOrderTrackingTemplate from "@modules/order-tracking/templates/guest-order-tracking-template"

export const metadata: Metadata = {
  title: "Track order",
  description: "Track a CBA order with your order number and email or phone.",
}

export default async function TrackOrderPage() {
  const session = await retrieveGuestTrackingSession()

  return (
    <main className="bg-white py-10 small:py-14">
      <div className="content-container">
        <GuestOrderTrackingTemplate initialTracking={session} />
      </div>
    </main>
  )
}
