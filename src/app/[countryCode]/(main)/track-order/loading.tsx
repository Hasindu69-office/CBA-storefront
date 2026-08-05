import OrderTrackingSkeleton from "@modules/order-tracking/components/order-tracking-states"

export default function TrackOrderLoading() {
  return (
    <main className="bg-white py-10 small:py-14">
      <div className="content-container">
        <OrderTrackingSkeleton />
      </div>
    </main>
  )
}
