import type { CbaOrderFulfillment } from "types/order-tracking"
import {
  formatStatusLabel,
  formatTrackingDate,
} from "../../utils/format-tracking"
import OrderStatusBadge from "../order-status-badge"
import TrackingLabelList from "../tracking-label-list"
import Thumbnail from "@modules/products/components/thumbnail"

type ShipmentCardProps = {
  fulfillment: CbaOrderFulfillment
  index: number
  embedded?: boolean
}

export default function ShipmentCard({
  fulfillment,
  index,
  embedded = false,
}: ShipmentCardProps) {
  return (
    <article
      className={
        embedded
          ? "rounded-[8px] border border-[#eeeeee] bg-white p-4"
          : "rounded-[8px] border border-[#eeeeee] bg-white p-5 shadow-[0_2px_12px_rgba(20,26,34,0.04)]"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold text-[#151922]">
            Shipment {index + 1}
          </h3>
          {fulfillment.provider_display_name && (
            <p className="mt-1 text-[13px] text-[#5d6470]">
              {fulfillment.provider_display_name}
            </p>
          )}
        </div>
        <OrderStatusBadge
          kind="shipment"
          statusKey={fulfillment.status}
          label={formatStatusLabel(fulfillment.status)}
        />
      </div>

      <dl className="mt-4 grid gap-2 text-[13px] text-[#5d6470] small:grid-cols-2">
        {fulfillment.shipped_at && (
          <div>
            <dt className="font-medium">Shipped</dt>
            <dd className="text-[#151922]">
              {formatTrackingDate(fulfillment.shipped_at)}
            </dd>
          </div>
        )}
        {fulfillment.delivered_at && (
          <div>
            <dt className="font-medium">Delivered</dt>
            <dd className="text-[#151922]">
              {formatTrackingDate(fulfillment.delivered_at)}
            </dd>
          </div>
        )}
      </dl>

      {fulfillment.items.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3 border-t border-[#eeeeee] pt-4">
          {fulfillment.items.map((item) => (
            <li key={`${fulfillment.id}-${item.line_item_id}`} className="flex gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[#f6f7f9]">
                <Thumbnail thumbnail={item.thumbnail} images={[]} size="square" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-[#151922]">
                  {item.title}
                </p>
                <p className="text-[13px] text-[#5d6470]">Qty {item.quantity}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-[#eeeeee] pt-4">
        <p className="mb-2 text-[13px] font-semibold text-[#5d6470]">Tracking</p>
        <TrackingLabelList labels={fulfillment.labels} />
      </div>
    </article>
  )
}
